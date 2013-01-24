
// Saves options to localStorage.
function save_options() {
  var valuesOverride = document.getElementById("values_override");
  var val = valuesOverride.value;
  localStorage["values_override"] = val;

  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Options Saved";
  setTimeout(function() {
    status.innerHTML = "";
  }, 1500);
}

// Restores text box state to saved value from localStorage.
function restore_options() {
  var val = localStorage["values_override"];
  if (!val) {
    return;
  }
  var valuesOverride = document.getElementById("values_override");
  valuesOverride.value = val;
}

document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);