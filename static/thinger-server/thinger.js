
// Global variables
var userRole;

// Extended jquery functions
$.fn.removeClassStartingWith = function (filter) {
    $(this).removeClass(function (index, className) {
        return (className.match(new RegExp("\\S*" + filter + "\\S*", 'g')) || []).join(' ')
    });
    return this;
};

// Nodes auxiliary functions

/**
 * Changes the icon of the asset selected for the input field node-row-assetId
 * @param {String} asset The asset desired to set the icon, can be device, type or group
 * @param {String} field The field name to change the icon of
 */
function changeFieldIcon(asset,field="assetId") {
    var fieldIcon = $(".node-row-"+field+" > div > label > i");
    var fieldLabel = $(".node-row-"+field+" > div > label");
    var fieldInput = $(".node-row-"+field+" > div > input");
    var placeholder = field === "assetId" ? "Select a X or insert a new one" : "X Filter";
    fieldIcon.removeClassStartingWith("fa-").removeClass("fa fas");

    switch (asset) { // TODO: update icons once Node-RED updates from v4.7: https://nodered.org/docs/creating-nodes/appearance#font-awesome-icon
        case 'brand':     fieldIcon.addClass("fa fa-paint-brush");      break;
        case 'bucket':    fieldIcon.addClass("fa fa-database");         break;
        case 'dashboard': fieldIcon.addClass("fa fa-tachometer");       break;
        case 'device':    fieldIcon.addClass("fa fa-rocket");           break;
        case 'domain':    fieldIcon.addClass("fa fa-at");               break;
        case 'endpoint':  fieldIcon.addClass("fa fa-server");           break;
        case 'group':     fieldIcon.addClass("fa fa-th");               break;
        case 'host':      fieldIcon.addClass("fa fa-laptop");           break;
        case 'mqtt':      fieldIcon.addClass("fa fa-wifi");             break;
        case 'oauth':     fieldIcon.addClass("fa fa-window-maximize");  break;
        case 'plugin':    fieldIcon.addClass("fa fa-cube");             break;
        case 'product':   fieldIcon.addClass("fa fa-shopping-bag");     break;
        case 'project':   fieldIcon.addClass("fa fa-folder");           break;
        case 'storage':   fieldIcon.addClass("fa fa-hdd-o");            break;
        case 'token':     fieldIcon.addClass("fa fa-lock");             break;
        case 'type':      fieldIcon.addClass("fa fa-list-ul");          break;
        case 'user':      fieldIcon.addClass("fa fa-users");            break;
    }

    fieldLabel.empty();
    fieldLabel.append(fieldIcon);
    fieldLabel.append(" ").append(asset.replace(/^\w/, (c) => c.toUpperCase()));
    fieldInput.prop("placeholder",placeholder.replace("X",asset.replace(/^\w/, (c) => c.toUpperCase())));
}

/**
 * Removes the options div and disables any event listeners so the don't acumulate
 * @param {String} field The name of the field from which the options div generated. Like node-input-<field>
 */
function destroyOptions(field) {

    // Remove previously set handlers or the will acumulate
    $(document).off('mouseup');
    $('#node-input-'+field).off('keyup');
    $(".red-form-options").remove();
}

/*
 * Filters the options to show or not the div if matches
 * @param {Object} obj The object representing the field from where it retrieves the value to filter
 */
function filterOptions(obj) {
    var value = obj.val().toLowerCase();
    var re = new RegExp(value,'g');

    $("span[class^='red-form-option'").each(function() {
        var id = $(this).children()[1].innerHTML.toLowerCase();
        var name = $(this).children()[2].innerHTML.toLowerCase();
        if (id.match(re) || name.match(re)) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
}

/**
 * Activates the option selected changing the class and assigning the value click to the corresponding field
 * @param {Object} obj The option div clicked
 * @param {String} field The name of the field from which the options div generated. Like node-input-<field>
 */
function activateOption(obj,field) {
    obj.removeClass("red-form-option");
    obj.addClass("red-form-option-active");

    //  Value to input (needs to be id to work with Node Red model), also fire event just in case
    inputValue = obj.children()[1].innerHTML;
    $("#node-input-"+field).val(inputValue);
    $("#node-input-"+field).trigger("change");

    // Handle destruction of element
    destroyOptions(field);
}

/**
 * Fills the options div with the options given in json format
 * @param {JSON} json The json object from the createOptions function
 * @param {String} field The name of the field from which the options div generated. Like node-input-<fiel>
 * @param {int} action The value of the action that executes, only needed for resources, allowed value 2 -> "in", 3 -> "out", 4 -> "in_out"
 * @param {Array} extraOps Extra options to fill into the options div at the beginning
 */
function fillOptions(json,field,action,extraOps) {
    var fieldValue = $("#node-input-"+field).val();
    var asset = field;
    if (field == "assetId" || field === "event") {
        var asset = $("#node-input-asset").val();
    } else if (field == "assetType") {
        var asset = "type";
    } else if (field == "assetGroup") {
        var asset = "group";
    }


    let elements = $(); // may create slack but will remove flickering
    let eventFields = []; // only used for server events

    for (var i in extraOps) {
        let option = $("<span>");
        let icon = $("<i>");
        let op = $("<strong>").text(extraOps[i]);

        option.addClass("red-form-option");
        option.append(icon,op);
        elements = elements.add(option);

        option.click(function() {
            activateOption($(this),field);
        });
    }

    // For each option from the json response create a new field and assign the corresponding values and icons
    for (var i in json) {
        // skip OTA resource
        if (i === "$ota") {
            continue;
        }

        // skip device resources accordingly
        if (field === "resource" && (json[i].fn != action && json[i].fn != 4)) {
            continue;
        }

        let option = $("<span>");
        if (fieldValue && (fieldValue == json[i].name
            || fieldValue == json[i][asset] || fieldValue == json[i].property)) {
            option.addClass("red-form-option-active"); // activate option if value is set
        } else {
            option.addClass("red-form-option");
        }

        var icon = $("<i>");
        if (json[i].hasOwnProperty('connection') || json[i].hasOwnProperty('enabled')) {
            icon.addClass("fa fa-circle");
            if ((json[i].hasOwnProperty('connection') && json[i].connection.active)
                 || (json[i].hasOwnProperty('enabled') && json[i].enabled)) {
                icon.addClass("icon-connected");
            } else {
                icon.addClass("icon-disconnected");
            }
        }

        let id;
        if (json[i].hasOwnProperty('fn')) { // device resources
            id = $("<strong>").text(i);
        } else if (json[i].hasOwnProperty('event')) { // server events
            let evento = json[i]["event"];
            if (field === "asset") {
                evento = evento.slice(0, evento.indexOf("_"));
            } else if (field === "event") {
                evento = evento.startsWith(asset) ? evento : "";
            }

            if (evento !== "" && eventFields.indexOf(evento) == -1
                && (userRole === "admin" || json[i]["role"] === userRole)) {
                eventFields.push(evento);
                id = $("<strong>").text(evento);
            } else { continue; } // skip adding of option
        } else {
            id = $("<strong>").text(json[i][asset] ? json[i][asset] : json[i].property);
        }

        let name = $("<small>").text(json[i].name);
        let separator = json[i].name ? " - ":"";

        option.append(icon,id,separator,name);
        elements = elements.add(option);

        // Event handler for each option
        option.click(function() {
            activateOption($(this),field);
        });

    }

    $(".red-form-option").remove();
    $(".red-form-option-active").remove();
    $(".red-form-options").append(elements);

    // Set the first option as active
    if (!$(".red-form-option-active").length) {
        let first = $(".red-form-options span:first-child");
        first.addClass("red-form-option-active");
        first.removeClass("red-form-option");
    }

}

/**
 * Creates the options div for the field pass as argument given the options in json format
 * @param {String} url The url from where to retrieve the data and the filtering
 * @param {String} field The name of the field from which the options div needs to be generated. Like node-input-<field>
 * @param {int} action The value of the action that executes, only needed for resources, allowed value 2 -> "in", 3 -> "out", 4 -> "in_out"
 * @param {function} callback Function to execute with the JSON response from the inside queries
 * @param {Array} extraOps Extra options to fill into the options div at the beginning
 */
function createOptions(url,field,action,callback,extraOps) {

    // Container
    $("<div>").insertAfter("#node-input-"+field)
    .addClass("red-form-options");

    // Keep div active while no clicks outside
    $(document).mouseup(function (e) {
        if (!($(".red-form-options").is(e.target) || $("#node-input-"+field).is(e.target))// if the target of the click is the container...
        && $(".red-form-options").has(e.target).length === 0) // ... or a descendant of the container
        {
            destroyOptions(field);
        }
    });

    // Filtering event handler
    $("#node-input-"+field).on("keyup",function(e) {
        switch (e.key) {
            case "Enter":
                activateOption($(".red-form-option-active"), field);
                break;
            case "ArrowUp": {
                let selected = $(".red-form-option-active");
                let prev = selected.prev();
                if (prev.length) {
                  selected.removeClass("red-form-option-active");
                  selected.addClass("red-form-option");
                  prev.removeClass("red-form-option");
                  prev.addClass("red-form-option-active");
                }
                break;
            }
            case "ArrowDown": {
                let selected = $(".red-form-option-active");
                let next = selected.next();
                if (next.length) {
                  selected.removeClass("red-form-option-active");
                  selected.addClass("red-form-option");
                  next.removeClass("red-form-option");
                  next.addClass("red-form-option-active");
                }
                break;
            }
            default:
                if (field == "property" || field == "resource" || field == "asset") { // TODO: remove once search over properties and or resources is implemented in the server, keep asset
                    filterOptions($(this));
                } else {
                    $.getJSON(url+"?name="+$(this).val().toLowerCase(), function(json) {
                      fillOptions(json,field,action,extraOps); // action added in case above TODO is implemented for resource
                        if (typeof callback === "function") {
                          callback(json);
                        }
                    });
                }
        }
    });


    // Fill with options
    $.getJSON(url, function(json) {
        fillOptions(json,field,action,extraOps);
        if (typeof callback === "function") {
            callback(json);
        }
    });

}

/**
 * Retrieves and sets the role of the configured user in the backend
 */
function getUserRole() {

    $.ajax({
        url: "users/user",
        async: false,
        dataType: 'json',
        success: function(data) {
            userRole = data.role;
        }
    });
}

/**
 * Generates a random password or credential of 16 characters of length. Used for device credentials
 */
function generateCredentials() {

    let chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let length = 15;
    let password = "";

    for (var i = 0; i <= length; i++) {
        var randomNumber = Math.floor(Math.random() * chars.length);
        password += chars.substring(randomNumber, randomNumber +1);
    }

    return password;
}

$(window).ready(function () {

    // Get and set global variables
    getUserRole();

    if ($("#node-input-asset").length && $("#node-input-asset").val()) {
        changeFieldIcon($("#node-input-asset").val(),"assetId");
    }
});
