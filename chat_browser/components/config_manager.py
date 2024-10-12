# components/config_manager.py
import yaml
from pathlib import Path

class ConfigManager:
    def __init__(self, config_path='config.yaml'):
        self.config_path = Path(config_path)
        self.config = self.load_config()

    def load_config(self):
        if not self.config_path.exists():
            return self.default_config()
        with open(self.config_path, 'r') as f:
            return yaml.safe_load(f)

    def default_config(self):
        return {
            'monitor_path': 'tmp/messages/',
            'parsed_path': 'tmp/parsed/'
        }

    def save_config(self, new_config):
        with open(self.config_path, 'w') as f:
            yaml.dump(new_config, f)
        self.config = new_config

    def get(self, key, default=None):
        return self.config.get(key, default)

    def set(self, key, value):
        self.config[key] = value
