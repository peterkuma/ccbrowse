import boto
import boto.s3.connection
import io
from boto.exception import BotoClientError, BotoServerError

from ccbrowse import utils
from .driver import Driver


class S3Driver(Driver):
    """S3 driver class.

    Store objects in S3 object storage.
    """
    def __init__(self, config, *args, **kwargs):
        for name in ['bucket', 'src']:
            if not name in config:
                ValueError('S3 driver: "%s" configuration field is required' % name)

        self.config = {
            'host': 'localhost',
            'port': 4568,
            'secure': False,
            'access_key': '',
            'secret_key': '',
        }
        self.config.update(config)

        try:
            self.conn = boto.connect_s3(
                self.config['access_key'],
                self.config['secret_key'],
                host=self.config['host'],
                port=self.config.get('port'),
                is_secure=self.config['secure'],
                calling_format=boto.s3.connection.OrdinaryCallingFormat(),
            )
        except (BotoClientError, BotoServerError) as e:
            raise IOError('Cannot connect to S3 storage "%s": %s' % (
                self.config['host'],
                e.message,
            ))

        Driver.__init__(self, config, *args, **kwargs)

    def store(self, obj):
        if self.on_store:
            self.on_store(obj)

        bucket_name = utils.substitute(self.config['bucket'], obj)
        key_name = utils.substitute(self.config['src'], obj)

        try:
            bucket = self.conn.get_bucket(bucket_name, validate=False)
            key = bucket.new_key(key_name)
            if 'content_type' in obj:
                key.content_type = obj['content_type']
            key.set_contents_from_file(io.BytesIO(obj['raw_data']))
        except (BotoClientError, BotoServerError) as e:
            raise IOError('Cannot store S3 object "%s/%s": %s' % (
                bucket_name,
                key_name,
                e.message,
            ))

    def retrieve(self, obj, exclude=[]):
        o = obj.copy()
        bucket_name = utils.substitute(self.config['bucket'], obj)
        key_name = utils.substitute(self.config['src'], obj)
        try:
            bucket = self.conn.get_bucket(bucket_name, validate=False)
            key = bucket.get_key(key_name, validate=False)
            if key is None:
                return None
            #o['modified'] = key.last_modified
            o['raw_data'] = key.get_contents_as_string()
        except (BotoClientError, BotoServerError) as e:
            return None
        return Driver.retrieve(self, o, exclude)
