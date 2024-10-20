import logging
import os
from datetime import datetime


def store_message(html_text, message_id, project_path):
    # Extract timestamp part from message_id
    timestamp_ms = int(message_id.split('-')[1])
    timestamp_s = timestamp_ms / 1000

    # Convert to datetime object and format as yyyy-mm-dd-hh-mm-ss
    yyyymmddhhmmss = datetime.utcfromtimestamp(timestamp_s).strftime('%Y-%m-%d-%H-%M-%S')

    file_path = f'tmp/messages/{yyyymmddhhmmss}.html'

    # mkdir
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(f'<path>{project_path}</path>\n')
        f.write(html_text)
    logging.INFO(f'Saved message to: {file_path}')
