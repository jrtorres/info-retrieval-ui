# Note:
Modified the original [Answer Retrieval Starter Kit](https://github.com/watson-developer-cloud/answer-retrieval) to have only the user interface for interacting with Retrieve and Rank. Also included a rows parameter in the env file to be used in select and fcselect queries for the application.


### Prerequisites
You will need the following in order to use this SK:

- A Unix-based OS (or Cygwin)
- [Git](https://git-scm.com/downloads)
- [Node.js](https://www.continuum.io/downloads)
- [python](https://www.python.org/downloads/)
- [A bluemix account](https://console.ng.bluemix.net/)
- [An instance of the Retrieve and Rank service](https://console.ng.bluemix.net/catalog/services/retrieve-and-rank/)

If you are using a Linux system, the `git`, `python`, and
`node.js` packages may be installable through your system's package
manager.


### Installing dependencies for the application

1. Install the dependencies using `pip`.

    ```sh
    pip install -r requirements.txt
    ```
2. Create a `.env` using `.env.example` as example. You will need credentials for the Retrieve and Rank service.

3. Start the application.

    ```sh
    python server.py
    ```
