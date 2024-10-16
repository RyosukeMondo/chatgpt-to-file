import logging
import os
from datetime import datetime
import pytz

# Assuming there's a storage mechanism, e.g., database or in-memory storage
# For demonstration, we'll use a simple in-memory list

message_store = []


def store_message(content, snippet_id=None, file_path=None):
    try:
        message = {
            'content': content,
            'snippet_id': snippet_id,
            'file_path': file_path
        }
        message_store.append(message)
        save_to_file(content, snippet_id, file_path)
        logging.info(f'Message stored: {message}')
    except Exception as e:
        logging.error(f'Error storing message: {e}')


def save_to_file(html_text, message_id, project_path):
    timestamp_ms = int(message_id.split('-')[1])
    timestamp_s = timestamp_ms / 1000

    # Convert to datetime object and format as yyyy-mm-dd-hh-mm-ss
    dt = datetime.fromtimestamp(timestamp_s, pytz.timezone('Asia/Tokyo'))
    timestamp_s = dt.strftime('%Y-%m-%d-%H-%M-%S')

    file_path = f'tmp/messages/{timestamp_s}.html'

    # mkdir
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(f'<path>{project_path}</path>\n')
        f.write(html_text)
    # print(f'Saved message to: {file_path}')
