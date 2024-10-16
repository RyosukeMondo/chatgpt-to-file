import json
import logging

from app.utils.file_utils import save_file, send_all_files
from app.managers.message_manager import store_message


async def handle_message(message, websocket):
    """
    Main entry point for handling incoming WebSocket messages.
    Delegates processing based on the message type.

    Args:
        message (str): The raw JSON message received from the WebSocket.
        websocket (WebSocketServerProtocol): The WebSocket connection.

    Returns:
        dict or None: Response to send back to the client, or None if handled internally.
    """
    try:
        data = json.loads(message)
    except json.JSONDecodeError:
        logging.error('Invalid JSON format received.')
        return generate_error_response('Invalid JSON format.')

    message_type = data.get('type')
    if message_type == 'SYNC':
        return await handle_sync_message(data, websocket)
    else:
        return await handle_data_message(data, websocket)


async def handle_sync_message(data, websocket):
    """
    Handles messages of type 'SYNC' by sending all tracked files to the client.

    Args:
        data (dict): The parsed JSON data.
        websocket (WebSocketServerProtocol): The WebSocket connection.

    Returns:
        dict or None: Error response if destination is missing, else None.
    """
    destination = data.get('destination')
    if destination:
        await send_all_files(websocket, destination)
        return None  # Responses are handled within send_all_files
    else:
        logging.error('SYNC message missing destination.')
        return generate_error_response('Missing destination in SYNC message.')


async def handle_data_message(data, websocket):
    """
    Handles data messages based on their 'kind' field.

    Args:
        data (dict): The parsed JSON data.
        websocket (WebSocketServerProtocol): The WebSocket connection.

    Returns:
        dict: Response to send back to the client.
    """
    kind = data.get('kind')
    if kind == 'snippet':
        return await handle_snippet_message(data)
    elif kind == 'assistant':
        return handle_assistant_message(data)
    else:
        logging.error('Unknown message type received.')
        return generate_error_response('Unknown message type.')


async def handle_snippet_message(data):
    """
    Processes 'snippet' kind messages by saving the provided file content.

    Args:
        data (dict): The parsed JSON data.

    Returns:
        dict: Success or error response.
    """
    file_path = data.get('filePath')
    content = data.get('content')
    snippet_id = data.get('id')

    if snippet_id is None:
        logging.error('Snippet message missing id.')
        return generate_error_response('Missing snippet id.', snippet_id)

    if file_path and content:
        saved_path = await save_file(file_path, content)
        if saved_path:
            return {
                'status': 'success',
                'savedPath': saved_path,
                'id': snippet_id
            }
        else:
            return {
                'status': 'error',
                'message': 'Failed to save file.',
                'id': snippet_id
            }
    else:
        logging.error('Invalid snippet message format.')
        return {
            'status': 'error',
            'message': 'Invalid message format.',
            'id': snippet_id
        }


def handle_assistant_message(data):
    """
    Processes 'assistant' kind messages by storing the message content.

    Args:
        data (dict): The parsed JSON data.

    Returns:
        dict: Success or error response.
    """
    content = data.get('content')
    snippet_id = data.get('id')
    file_path = data.get('filePath')

    if content:
        store_message(content, snippet_id, file_path)
        return {
            'status': 'success',
            'content': content
        }
    else:
        logging.error('Invalid assistant message format.')
        return generate_error_response('Invalid message format.')


def generate_error_response(message, snippet_id=None):
    """
    Generates a standardized error response.

    Args:
        message (str): The error message.
        snippet_id (str, optional): The snippet ID if applicable.

    Returns:
        dict: The error response.
    """
    response = {
        'status': 'error',
        'message': message
    }
    if snippet_id is not None:
        response['id'] = snippet_id
    return response
