import logging
import os


def setup_logging():
    log_directory = os.path.join(os.path.dirname(__file__), '..', 'logs')
    os.makedirs(log_directory, exist_ok=True)
    log_path = os.path.join(log_directory, 'websocket_receiver.log')
    
    logging.basicConfig(
        filename=log_path,
        level=logging.DEBUG,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    logging.debug('Logging is configured.')
