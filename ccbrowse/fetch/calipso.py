import sys
import os
import time
import suds
from xml.etree import ElementTree
import logging
import subprocess
import urllib.request, urllib.error, urllib.parse
from contextlib import closing

from ccbrowse import utils

logging.getLogger('suds.client').setLevel(logging.CRITICAL)


class Calipso(object):
    CLIENT_ID = 'ccbrowse'
    AUTHENTICATION_SERVICE = 'http://api.echo.nasa.gov/echo-wsdl/v10/AuthenticationService.wsdl'
    USER_SERVICE = 'http://api.echo.nasa.gov/echo-wsdl/v10/UserService.wsdl'
    CATALOG_SERVICE = 'http://api.echo.nasa.gov/echo-wsdl/v10/CatalogService.wsdl'
    ORDER_MANAGEMENT_SERVICE = 'http://api.echo.nasa.gov/echo-wsdl/v10/OrderManagementService.wsdl'
    FTP_SERVER = 'xfr140.larc.nasa.gov'
    
    AOL = '''<?xml version="1.0" encoding="UTF-8"?>    
<!DOCTYPE query PUBLIC "-//ECHO CatalogService (v10)//EN"
"http://api.echo.nasa.gov/echo/dtd/IIMSAQLQueryLanguage.dtd">
<query>
    <for value="granules"/>
    <dataCenterId><value>LARC_ASDC</value></dataCenterId>
    <where>
        <granuleCondition>
            <dataSetId>
                <list>
                    <value>CAL_LID_L1-ValStage1-V3-01</value>
                    <value>CAL_LID_L1-ValStage1-V3-02</value>
                </list>
            </dataSetId>
        </granuleCondition>
        <granuleCondition>
            <temporal>
                <startDate><Date YYYY="{startdate.year}" MM="{startdate.month}" DD="{startdate.day}" HH="{startdate.hour}" MI="{startdate.minute}" /></startDate>
                <stopDate><Date YYYY="{stopdate.year}" MM="{stopdate.month}" DD="{stopdate.day}" HH="{stopdate.hour}" MI="{stopdate.minute}" /></stopDate>
            </temporal>
        </granuleCondition>
    </where>
</query>
'''

    XFORMS = '''<?xml version="1.0" encoding="UTF-8"?>
<asdc:options xmlns:asdc="http://asdc.nasa.gov/options">
    <asdc:distribution>
        <asdc:mediatype>
            <asdc:value>FtpPull</asdc:value>
        </asdc:mediatype>
        <asdc:mediaformat>
        <asdc:ftppull-format>
            <asdc:value>FILEFORMAT</asdc:value>
        </asdc:ftppull-format>
    </asdc:mediaformat>
    </asdc:distribution>
</asdc:options>
'''
    
    def __init__(self, config, path=''):
        default_config = {
            'login': '',
            'password': '',
            'contact': {
                'firstName': '',
                'lastName': '',
                'email': '',
                'street': '',
                'city': '',
                'country': '',
                'phone': '',
            }
        }

        self.config = default_config
        self.config.update(config)
        self.path = path
        self.token = None
        
    def order(self, startdate, stopdate, tracking_id=None):
        try:
            if not tracking_id: self.do_order(startdate, stopdate)
            else: self.download(tracking_id)
        except suds.WebFault as e:
            print(e, file=sys.stderr)
        except urllib.error.URLError as e:
            print(e.reason, file=sys.stderr)
    
    def do_order(self, startdate, stopdate):        
        sys.stderr.write('Initializing NASA ECHO services... ')
        sys.stderr.flush()
        self.init_wsdl_services()
        print('DONE', file=sys.stderr)
        
        sys.stderr.write('Authenticating... ')
        sys.stderr.flush()
        if not self.token: self.authenticate()
        print('DONE', file=sys.stderr)
        
        sys.stderr.write('Looking up items... ')
        sys.stderr.flush()
        guids = self.lookup(startdate, stopdate)
        print('DONE', file=sys.stderr)
        
        if len(guids) == 0:
            print('No items found', file=sys.stderr)
            return
        
        print('Found items ' + ', '.join(guids), file=sys.stderr)
        
        sys.stderr.write('Creating order... ')
        sys.stderr.flush()
        oguid = self.create_order(guids)
        print('DONE', file=sys.stderr)
        
        print('Order GUID is %s' % oguid, file=sys.stderr)
        
        sys.stderr.write('Requesting order quotation... ')
        sys.stderr.flush()
        self.quote_order(oguid)
        while not self.order_is_validated(oguid):
            sys.stderr.write('.')
            sys.stderr.flush()
            time.sleep(15)
        print('DONE', file=sys.stderr)
        
        price = self.get_order_price(oguid)
        print('Price for the order is $%d' % price, file=sys.stderr)
        
        if price != 0:
            print('Order price is not 0, not submitting the order', file=sys.stderr)
            return
        
        sys.stderr.write('Submitting order (this may take a while)... ')
        sys.stderr.flush()
        self.submit_order(oguid)
        while not self.order_is_closed(oguid):
            sys.stderr.write('.')
            sys.stderr.flush()
            time.sleep(15)
        print('DONE', file=sys.stderr)
        
        tracking_id = self.get_tracking_id(oguid)
        print('Tracking ID is %s' % tracking_id, file=sys.stderr)
        
        self.download(tracking_id)
        
    def download(self, tracking_id):
        url = 'ftp://%s/%s/' % (self.FTP_SERVER, tracking_id)
        
        try:
            with closing(urllib.request.urlopen(url)) as f:
                # TODO: Support white-space in file names.
                files = [os.path.basename(l.split()[-1]) for l in f.readlines() if l[0] != 'd']
        except urllib.error.URLError as e: print("%s: %s" % (url, e), file=sys.stderr)
        
        for name in files:
            if name[0] == '.' or not name.endswith('.hdf'): continue
            filename = os.path.join(self.path, name)
            try:
                utils.download(url+name, filename, progress=True)
                print(name)
            except urllib.error.URLError as e: print("%s: %s" % (url+name ,e), file=sys.stderr)

    def init_wsdl_services(self):
        self.auth = suds.client.Client(self.AUTHENTICATION_SERVICE)
        self.user = suds.client.Client(self.USER_SERVICE)
        self.catalog = suds.client.Client(self.CATALOG_SERVICE)
        self.om = suds.client.Client(self.ORDER_MANAGEMENT_SERVICE)
        
    def authenticate(self):
        ci = self.auth.factory.create('ns2:ClientInformation')
        ci.ClientId = self.CLIENT_ID
        ci.UserIpAddress = '127.0.0.1'
        self.token = self.auth.service.Login(self.config['login'], self.config['password'], ci)

    def lookup(self, startdate, stopdate):
        ResultType = self.catalog.factory.create('ns2:ResultType')
        aol = self.AOL.format(startdate=startdate, stopdate=stopdate)
        results = self.catalog.service.ExecuteQuery(self.token, aol, ResultType.RESULTS)
        tree = ElementTree.fromstring(results.Results.ReturnData)
        guids = tree.findall('.//ECHOItemId')
        return [guid.text for guid in guids]
    
    def create_contact(self):
        user = self.user.service.GetCurrentUser(self.token)
        c = self.om.factory.create('ns2:Contact')
        c.Role = 'User'
        c.FirstName = user.FirstName
        c.LastName = user.LastName
        c.Email = user.Email
        c.Address = user.Addresses[0]
        c.Phones.Item.append(user.Phones[0])
        return c
    
    def create_order(self, guids):
        # Create a list of items to order.
        items = self.om.factory.create('ns2:ListOfOrderItems')
        for guid in guids:
            item = self.om.factory.create('ns2:OrderItem')
            item.ItemGuid = guid
            item.QuantityOrdered = 1
            items.Item.append(item)

        options = self.om.factory.create('ns2:OptionSelection')
        options.Name = 'ASDC_FTPPULL'
        options.Content = self.XFORMS

        c = self.create_contact()

        oguid = self.om.service.CreateOrder(self.token, items, options)
        UserDomain = self.om.factory.create('ns2:UserDomain')
        UserRegion = self.om.factory.create('ns2:UserRegion')
        self.om.service.SetUserInformationForOrder(self.token, oguid, c, c, c, UserDomain.OTHER, UserRegion.INTERNATIONAL)

        return oguid

    def quote_order(self, oguid):
        self.om.service.QuoteOrder(self.token, oguid)
    
    def order_is_validated(self, oguid):
        oguids = self.om.factory.create('ns2:ListOfStrings')
        oguids.Item.append(oguid)
        orders = self.om.service.GetOrders(self.token, oguids)
        return orders.Item[0].State == 'VALIDATED'
            
    def get_order_price(self, oguid):
        oguids = self.om.factory.create('ns2:ListOfStrings')
        oguids.Item.append(oguid)
        orders = self.om.service.GetOrders(self.token, oguids)
        return orders.Item[0].OrderPrice

    def submit_order(self, oguid):
        self.om.service.SubmitOrder(self.token, oguid)
        
    def order_is_closed(self, oguid):
        oguids = self.om.factory.create('ns2:ListOfStrings')
        oguids.Item.append(oguid)
        orders = self.om.service.GetOrders(self.token, oguids)
        return orders.Item[0].State == 'CLOSED'
    
    def get_tracking_id(self, oguid):
        oguids = self.om.factory.create('ns2:ListOfStrings')
        oguids.Item.append(oguid)
        orders = self.om.service.GetOrders(self.token, oguids)
        return orders.Item[0].ProviderOrders.Item[0].ProviderTrackingId

    def remove_order(self, oguid):
        oguids = self.om.factory.create('ns2:ListOfStrings')
        oguids.Item.append(oguid)
        self.om.service.RemoveOrders(self.token, oguids)
