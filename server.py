#!/usr/bin/env python
#
# Copyright 2016 IBM Corp. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# -*- coding: utf-8 -*-

"""
    usage: python server.py
    description: Run the Flask web server
"""
import os

from watson_developer_cloud import RetrieveAndRankV1
#from retrieve_and_rank_scorer.scorers import Scorers
from routes.fcselect import FcSelect
from requests.exceptions import HTTPError
from dotenv import load_dotenv, find_dotenv
import logging
from logging.handlers import TimedRotatingFileHandler
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

try:
    load_dotenv(find_dotenv())
except Exception:
    print ('warning: no .env file loaded')

# Application routes
@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/api/solr', methods=['GET'])
def solr():
    """Requests to Solr"""
    print("Route Handler: Solr request started - %s" % request.args.get('q'))
    result = app.pysolr_client.search(request.args.get('q'),**{
        'rows': os.getenv('NUMBER_ROWS')
    })
    print("Route Handler: Solr response complete - %s hits and %s documents." % (result.hits, len(result.docs)))
    return jsonify({'numFound': result.hits, 'docs': result.docs, 'start': 0})

@app.route('/api/ranker', methods=['GET'])
def default_ranker():
    """Requests to the default ranker"""
    print("Route Handler: Ranker request started - %s" % request.args.get('q'))
    params = {'ranker_id': os.getenv('RANKER_ID'),
              'q': request.args.get('q'),
              'fl': os.getenv('DEFAULT_FL'),
              'fq':'',
              'rows': os.getenv('NUMBER_ROWS')}

    app.logger.info('default_ranker request with args=%r' % params)
    print('default_ranker request with args=%r' % params)
    resp = app.scorers.fcselect_default(**params)
    print("Route Handler: Ranker response complete - %s hits and %s documents." % (resp['response']['numFound'], len(resp['response']['docs']) ))

    return jsonify(resp)

@app.errorhandler(Exception)
def handle_error(e):
    code = 500
    error = 'Error processing the request'
    app.logger.error('Exception : %r' % e)
    if isinstance(e, HTTPError):
        code = e.code
        error = str(e.message)

    return jsonify(error=error, code=code), code

def setup_file_logger():
    file_info_h = TimedRotatingFileHandler('logs/app.log', when='d', interval=1)
    file_info_h.setLevel(logging.INFO)
    app.logger.addHandler(file_info_h)

    error_file_h = TimedRotatingFileHandler('logs/error.log', when='d', interval=1)
    error_file_h.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s '
        '[in %(pathname)s:%(lineno)d]'
    ))
    error_file_h.setLevel(logging.ERROR)
    app.logger.addHandler(error_file_h)


if __name__ == "__main__":
    # Get host/port from the Bluemix environment, or default to local
    HOST_NAME = '0.0.0.0'
    PORT_NUMBER = int(os.getenv('PORT', '3000'))

    # disable file logging
    #setup_file_logger()

    url = os.getenv('RETRIEVE_AND_RANK_BASE_URL')
    username = os.getenv('RETRIEVE_AND_RANK_USERNAME')
    password = os.getenv('RETRIEVE_AND_RANK_PASSWORD')
    cluster_id = os.getenv('SOLR_CLUSTER_ID')
    collection_name = os.getenv('SOLR_COLLECTION_NAME')
    answer_directory = os.getenv('ANSWER_DIRECTORY')
    number_rows = os.getenv('NUMBER_ROWS')

    # custom scorer
    #custom_scorers = Scorers(feature_json_file)
    #app.scorers = FcSelect(custom_scorers, url, username, password, cluster_id,
    #                       collection_name, answer_directory)
    app.scorers = FcSelect(url, username, password, cluster_id,
                           collection_name, answer_directory)

    # Retrieve and Rank
    retrieve_and_rank = RetrieveAndRankV1(url=url, username=username, password=password)
    app.pysolr_client = retrieve_and_rank.get_pysolr_client(cluster_id, collection_name)

    # Start the server
    print('Starting server on port: %d on host : %s' % (PORT_NUMBER, HOST_NAME))
    app.run(host=HOST_NAME, port=PORT_NUMBER, debug=False)
    print ('Listening on %s:%d' % (HOST_NAME, PORT_NUMBER))
