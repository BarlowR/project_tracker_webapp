/**
 * Copyright 2018, Google LLC
 * Licensed under the Apache License, Version 2.0 (the `License`);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an `AS IS` BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 
// [START gae_python38_log]
// [START gae_python3_log]
'use strict';

var config = JSON.parse('{{ config | tojson | safe}}');

var active

window.addEventListener('load', function () {

  buildPage();

});





/*
  

  console.log("Page Loaded");
});

*/


function buildPage(){
  var body_element = document.getElementById('projectbody');
  body_element.innerHTML = "";

  for (let [project, entries] of Object.entries(config)){
        
    body_element.insertAdjacentHTML('beforeend', "<h2>" + project + "</h2>");


    var ckpts = entries.checkpoints

    if (typeof ckpts !== 'undefined'){

      for (const checkpoint of ckpts){
        document.getElementById('projectbody').insertAdjacentHTML('beforeend', "<div class = 'checkpoint'>" + checkpoint + "</div> ");
        
      }
    }
  }

  var checkpoints = document.getElementsByClassName("checkpoint");
      
  for (var item of checkpoints) {  
    item.addEventListener("click", function() {
      console.log("clicked: " + this.innerHTML);
      config['project3']['checkpoints'].push(this.innerHTML);
      buildPage();
      active = this;
      colorItems();
      saveConfig();
    });

  }

}


function colorItems(){
  var checkpoints = document.getElementsByClassName("checkpoint")
  for (var item of checkpoints) {  
    if (item == active) {
        item.style.color = "red";
    }
    else {
        item.style.color = "black";
    }
  }
}


function saveConfig(){
  let xhr = new XMLHttpRequest(); 
  let url = "save_config";


  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/json"); 

  var config_data = JSON.stringify(config); 

  xhr.send(config_data);


}


// [END gae_python3_log]
// [END gae_python38_log]
