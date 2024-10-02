import sys
import struct
import json
import os

def read_message():
    # Read message length (first 4 bytes).
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) == 0:
        sys.exit(0)
    message_length = struct.unpack('=I', raw_length)[0]
    # Read the message data.
    message = sys.stdin.buffer.read(message_length).decode('utf-8')
    return json.loads(message)

def send_message(message_content):
    encoded_content = json.dumps(message_content).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('=I', len(encoded_content)))
    sys.stdout.buffer.write(encoded_content)
    sys.stdout.buffer.flush()

def save_file(full_path, content):
    directory = os.path.dirname(full_path)
    if not os.path.exists(directory):
        os.makedirs(directory)
    
    base, extension = os.path.splitext(full_path)
    counter = 1
    final_path = full_path

    # Avoid overwriting existing files
    while os.path.exists(final_path):
        final_path = f"{base}({counter}){extension}"
        counter += 1

    with open(final_path, 'w', encoding='utf-8') as f:
        f.write(content)
    return final_path

def main():
    while True:
        try:
            message = read_message()
            file_path = message.get('filePath')
            content = message.get('content')
            snippet_id = message.get('id')

            if file_path and content:
                saved_path = save_file(file_path, content)
                response = {
                    'status': 'success',
                    'savedPath': saved_path,
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
        except Exception as e:
            response = {
                'status': 'error',
                'message': str(e)
            }
            send_message(response)

if __name__ == '__main__':
    main()
