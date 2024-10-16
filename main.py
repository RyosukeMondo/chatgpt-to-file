import asyncio
import json
import logging

import websockets
from app.handlers.message_handler import handle_message
from app.config.logging_config import setup_logging

# Initialize logging
setup_logging()


async def handler(websocket, path):
    logging.info('Client connected.')
    try:
        async for message in websocket:
            logging.debug(f'Received message: {message}')
            response = await handle_message(message, websocket)
            if response:
                await websocket.send(json.dumps(response))
                logging.debug(f'Sent response: {response}')
    except websockets.exceptions.ConnectionClosed as e:
        logging.info(f'Connection closed: {e}')


async def main():
    server = await websockets.serve(handler, 'localhost', 8765)
    logging.info('WebSocket server started on ws://localhost:8765')
    await server.wait_closed()


if __name__ == '__main__':
    asyncio.run(main())
