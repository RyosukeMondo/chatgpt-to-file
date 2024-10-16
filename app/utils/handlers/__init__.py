from app.utils.handlers.javascript_handler import JavaScriptHandler
from app.utils.handlers.php_handler import PHPHandler
from app.utils.handlers.python_handler import PythonHandler
from app.utils.handlers.html_handler import HTMLHandler
from app.utils.handlers.css_handler import CSSHandler
# Import other handlers as needed

# Mapping from file extension to handler instance
EXTENSION_HANDLER_MAP = {
    '.js': JavaScriptHandler(),
    '.jsx': JavaScriptHandler(),
    '.ts': JavaScriptHandler(),
    '.tsx': JavaScriptHandler(),
    '.php': PHPHandler(),
    '.py': PythonHandler(),
    '.html': HTMLHandler(),
    '.htm': HTMLHandler(),
    '.css': CSSHandler(),
    '.go': JavaScriptHandler(),
    # Add other extensions and their handlers here
}


def get_handler_for_extension(extension):
    """
    Retrieves the handler instance for the given file extension.

    Args:
        extension (str): The file extension (e.g., '.js').

    Returns:
        Handler | None: The handler instance or None if not found.
    """
    return EXTENSION_HANDLER_MAP.get(extension.lower())
