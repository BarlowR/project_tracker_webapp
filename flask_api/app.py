# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# [START gae_python38_render_template]
# [START gae_python3_render_template]
from __future__ import print_function
import pickle
import os.path
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
from flask import Flask, render_template, request, redirect
from flask_cors import CORS
import datetime
import json
import io


app = Flask(__name__)
CORS(app)

SCOPES = ['https://www.googleapis.com/auth/drive.appdata', 'https://www.googleapis.com/auth/drive.file']

config_filename = "time.json"

creds = None

service = None


@app.route('/')
def root():

    #build the google drive service
    build_service()
      
    return render_template('index.html')



@app.route('/get_config')
def script():

    if not os.path.isfile(config_filename):

        #build the google drive service
        build_service()

        #pull a list of files
        response = service.files().list(spaces='appDataFolder',
                                          fields='nextPageToken, files(id, name)',
                                          pageSize=10).execute()

        found = False
        print("searching...")

        #iterate through the files, download the config file and save it locally
        for file in response.get('files', []):
            # Process change
            file_name = file.get('name')
            file_id = file.get('id')
            print ('Found file: %s (%s)' % (file_name, file_id))
            
            if file.get('name') == config_filename:
                
                request = service.files().get_media(fileId=file_id)
                fh = io.BytesIO()
                downloader = MediaIoBaseDownload(fh, request)
                done = False
                while done is False:
                    status, done = downloader.next_chunk()
                    print ("Download %d%%." % int(status.progress() * 100))

                fh.seek(0)
                with open(os.path.join('./', file_name), 'wb') as f:
                    f.write(fh.read())
                    f.close()
                found = True
                break

    #open the local config file and load it into memory
    page_data = {}
    try:
        with open(config_filename, "r+") as config:
            page_data = json.load(config)
            #print(page_data)
    
    except:
        print("error")


    return page_data





@app.route("/save_config", methods=['POST'])

def save_config():

    if request.method == 'POST':

        #build google credentials and service
        build_service()

        #get the updated information from the frontend
        page_data = request.json
        #print(content)

        #write the new info to our local file
        try:
            with open(config_filename, "r+") as config:
                config.seek(0)
                config.write(json.dumps(page_data, sort_keys=True, indent=4))
        except:
            print("Error writing to local file")

        

        file_metadata = {
            'name': config_filename,
            'mimetype': 'application/json'
        }

        #get a list of the files in our appdata folder
        response = service.files().list(spaces='appDataFolder',
                                      fields='nextPageToken, files(id, name)',
                                      pageSize=10).execute()


        #iterate through the list of files and look for the page config file
        print("Searching for " + config_filename)
        exists = False
        for file in response.get('files', []):

                file_name = file.get('name')
                file_id = file.get('id')
                print ('Found file: %s (%s)' % (file_name, file_id))
                
                #if we find the file, update it to reflect the new data
                if file.get('name') == config_filename:
                    file_json = MediaFileUpload(config_filename, mimetype = 'application/json')
                    file = service.files().update(fileId = file_id, 
                                                  body = file_metadata,
                                                  media_body = file_json).execute()
                    print(config_filename + " updated successfully")
                    exists = True
                    break
        
        #if we don't find the config file, create a config file in the appdata folder
        if not exists:
            file_metadata['parents'] = 'appDataFolder'
            file_json = MediaFileUpload(config_filename, mimetype = 'application/json')
            file = service.files().create(body = file_metadata,
                                          media_body = file_json, 
                                          fields='id').execute()
            print("Created " + config_filename + ", " + file.get('id'))

        return str(exists)





@app.route("/reset_config/besure")
def reset_config():

    print("Resetting configuration")

    build_service()

    #get a list of the files in our appdata folder
    response = service.files().list(spaces='appDataFolder',
                                  fields='nextPageToken, files(id, name)',
                                  pageSize=10).execute()


    #iterate through the list of files and delete each one
    for file in response.get('files', []):

            file_name = file.get('name')
            file_id = file.get('id')
            print ('Found file: %s (%s)' % (file_name, file_id))

            try:
                service.files().delete(fileId = file_id).execute()

            except error:
                print ('An error occurred deleting file ' + file_name + ": " + error)

            else:
                print("Deleted file:" + file_name)

    return redirect('../')














def build_service():
    global creds, service

    if creds is None or service is None:
        if os.path.exists('token.pickle'):
            with open('token.pickle', 'rb') as token:
                creds = pickle.load(token)
       
        # If there are no (valid) credentials available, let the user log in.
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    'credentials.json', SCOPES)
                creds = flow.run_local_server(port=8080)
            # Save the credentials for the next run
            with open('token.pickle', 'wb') as token:
                pickle.dump(creds, token)

        #build google drive service
        service = build('drive', 'v3', credentials=creds)


if __name__ == '__main__':
    # This is used when running locally only. When deploying to Google App
    # Engine, a webserver process such as Gunicorn will serve the app. This
    # can be configured by adding an `entrypoint` to app.yaml.
    # Flask's development server will automatically serve static files in
    # the "static" directory. See:
    # http://flask.pocoo.org/docs/1.0/quickstart/#static-files. Once deployed,
    # App Engine itself will serve those files as configured in app.yaml.
    app.run(host='127.0.0.1', port=8000, debug=True)
# [END gae_python3_render_template]
# [END gae_python38_render_template]
