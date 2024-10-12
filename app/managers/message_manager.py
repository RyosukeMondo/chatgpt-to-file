import logging

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
        logging.info(f'Message stored: {message}')
    except Exception as e:
        logging.error(f'Error storing message: {e}')