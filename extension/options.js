/*
 * Copyright 2013 readyState Software Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Saves options
function save_options() {
  var valuesOverride = document.getElementById("values_override");
  var status = document.getElementById("status");
  var val = valuesOverride.value;
  var obj;

  try {
    obj = JSON.parse(val);
  } catch(ex) {
    status.innerHTML = "Parse error";
    setTimeout(function() {
      status.innerHTML = "";
    }, 1500);
  }
  //alert(obj);
  // Check that there's some code there.
  if (!obj) {
    return;
  }
  // Save it using the Chrome extension storage API.
  chrome.storage.sync.set({'values_override': obj}, function() {
    // Update status to let user know options were saved.
    status.innerHTML = "Options Saved";
    setTimeout(function() {
      status.innerHTML = "";
    }, 1500);
  });

}

// Restores text box state to saved value
function restore_options() {
  chrome.storage.sync.get('values_override', function(items) {
    var val;
    if (items.values_override) {
      val = items.values_override;
    } else {
      val = _DEFAULT_VALUES;
    }
    var valuesOverride = document.getElementById("values_override");
    valuesOverride.value = JSON.stringify(val, null, 4);
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);