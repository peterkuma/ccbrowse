import ccloud.server
import json

config = ccloud.config.default_config
with open('config.json') as fp:
    config.update(json.load(fp))
app = ccloud.server.app(config)
