# receiver.py

import sys
import struct
import json
import os
import logging

# Configure logging
logging.basicConfig(
    filename='receiver.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def read_message():
    try:
        # Read message length (first 4 bytes).
        raw_length = sys.stdin.buffer.read(4)
        if len(raw_length) == 0:
            logging.info('No more messages. Exiting.')
            sys.exit(0)
        message_length = struct.unpack('=I', raw_length)[0]
        # Read the message data.
        message = sys.stdin.buffer.read(message_length).decode('utf-8')
        logging.debug(f'Received message: {message}')
        return json.loads(message)
    except Exception as e:
        logging.error(f'Error reading message: {e}')
        return {}

def send_message(message_content):
    try:
        encoded_content = json.dumps(message_content).encode('utf-8')
        sys.stdout.buffer.write(struct.pack('=I', len(encoded_content)))
        sys.stdout.buffer.write(encoded_content)
        sys.stdout.buffer.flush()
        logging.debug(f'Sent message: {message_content}')
    except Exception as e:
        logging.error(f'Error sending message: {e}')

def save_file(full_path, content):
    try:
        directory = os.path.dirname(full_path)
        if not os.path.exists(directory):
            os.makedirs(directory)
            logging.debug(f'Created directory: {directory}')
        
        base, extension = os.path.splitext(full_path)
        counter = 1
        final_path = full_path

        # Avoid overwriting existing files
        while os.path.exists(final_path):
            final_path = f"{base}({counter}){extension}"
            counter += 1

        with open(final_path, 'w', encoding='utf-8') as f:
            f.write(content)
        logging.info(f'File saved: {final_path}')
        return final_path
    except Exception as e:
        logging.error(f'Error saving file {full_path}: {e}')
        raise

def main():
    logging.info('Receiver started.')
    while True:
        message = read_message()
        if not message:
            continue

        file_path = message.get('filePath')
        content = message.get('content')
        snippet_id = message.get('id')

        if file_path and content:
            try:
                saved_path = save_file(file_path, content)
                response = {
                    'status': 'success',
                    'savedPath': saved_path,
                    'id': snippet_id
                }
                send_message(response)
            except Exception as e:
                response = {
                    'status': 'error',
                    'message': str(e),
                    'id': snippet_id
                }
                send_message(response)
        else:
            response = {
                'status': 'error',
                'message': 'Invalid message format.',
                'id': snippet_id
            }
            send_message(response)

if __name__ == '__main__':
    main()
