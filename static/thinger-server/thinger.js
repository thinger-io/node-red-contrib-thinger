
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
 */
function changeAssetIdIcon(asset) {
    var assetIdIcon = $(".node-row-assetId > div > label > i");
    var assetIdLabel = $(".node-row-assetId > div > label");
    var assetIdInput = $(".node-row-assetId > div > input");
    var placeholder = "Select a X or insert a new one";

    assetIdIcon.removeClassStartingWith("fa-");

    switch (asset) {
        case 'device':
            assetIdIcon.addClass("fa-rocket");
            break;
        case 'type':
            assetIdIcon.addClass("fa-list-ul");
            break;
        case 'group':
            assetIdIcon.addClass("fa-th");
            break;
    }

    assetIdLabel.empty();
    assetIdLabel.append(assetIdIcon);
    assetIdLabel.append(" ").append(asset.replace(/^\w/, (c) => c.toUpperCase()));
    assetIdInput.prop("placeholder",placeholder.replace("X",asset));
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
 */
function fillOptions(json,field) {
    var fieldValue = $("#node-input-"+field).val();
    var asset = $("#node-input-asset").val();

    // For each option from the json response create a new field and assign the corresponding values and icons
    for (var i in json) {
        let option = $("<span>");
        if (fieldValue && (fieldValue == json[i].name
            || fieldValue == json[i][asset] || fieldValue == json[i].property)) {
            option.addClass("red-form-option-active"); // activate option if value is set
        } else {
            option.addClass("red-form-option");
        }

        var icon = $("<i>");
        if (json[i].hasOwnProperty('connection')) {
            icon.addClass("fa fa-circle");
            if (json[i].connection.active) {
                icon.addClass("icon-connected");
            } else {
                icon.addClass("icon-disconnected");
            }
        }

        let id = $("<strong>").text(json[i][asset] ? json[i][asset] : json[i].property);

        let name = $("<small>").text(json[i].name);
        let separator = json[i].name ? " - ":"";

        option.append(icon,id,separator,name);
        $(".red-form-options").append(option);

        // Event handler for each option
        option.click(function() {
            activateOption($(this),field);
        });

    }

}

/**
 * Creates the options div for the field pass as argument given the options in json format
 * @param {JSON} json The response from the API call with the data
 * @param {String} field The name of the field from which the options div needs to be generated. Like node-input-<field>
 */
function createOptions(json,field) {

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
    $("#node-input-"+field).on("keyup",function() {
        filterOptions($(this));
    });


    // Fill with options
    fillOptions(json,field);

}


$(window).ready(function () {
  changeAssetIdIcon($("#node-input-asset").val());
});
