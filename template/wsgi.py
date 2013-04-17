import ccbrowse.server
import json

config = ccbrowse.config.default_config
with open('config.json') as fp:
    config.update(json.load(fp))
app = ccbrowse.server.app(config)
