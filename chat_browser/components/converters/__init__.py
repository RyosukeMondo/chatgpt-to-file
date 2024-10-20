import os
import importlib
from chat_browser.components.converters.base_converter import BaseConverter
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_converters():
    converters = []
    converters_dir = os.path.dirname(__file__)
    for filename in os.listdir(converters_dir):
        if filename.endswith('.py') and filename != 'base_converter.py' and not filename.startswith('__'):
            module_name = f".{filename[:-3]}"  # Remove .py extension
            try:
                logging.debug("Attempting to load module: {module_name}")
                module = importlib.import_module(module_name, package='chat_browser.components.converters')
                for attr in dir(module):
                    cls = getattr(module, attr)
                    if isinstance(cls, type):
                        logging.debug(f"Found class: {cls.__name__} in {filename}")
                        if issubclass(cls, BaseConverter) and cls != BaseConverter:
                            logging.debug("Adding converter: {cls.__name__}")
                            converters.append(cls())
            except Exception as e:
                logger.error(f"Failed to load converter from {filename}: {e}")
    logging.info(f"Total converters loaded: {len(converters)}")
    return converters
