'use strict';

class ThingerDOM {

    // ----------------------- //
    // Utility DOM functionality //
    // ----------------------- //

    // This functions registers the event handlers for the list of fields passed for the node
    // as long as the fields match with the asset types
    static registerFocusHandler(node_id, fields, option = "") {

      fields.forEach(f => {

          ThingerDOM.registerGenericFocusHandler(node_id, f, f, undefined, undefined, option);

      });

    }

    /*
     * @param {string} node_id - node id
     * @param {string} field - field to register the handler
     * @param {string} assetType - asset type to filter the options. For example, device, bucket, etc.
     * @param {string|object} assetId - asset id to filter the options or object of the asset
     * @param {object} editor - editor to fill with the selected option
     * @param {string} option - additional option for assets. For example for resources it would mark if, input or output.
     */
    static registerGenericFocusHandler(node_id, field, assetType, assetId, editor, option = "") {

        //  Remove previously set handlers or the will acumulate
        $(`#node-input-${field}`).off('focus');

        $(`#node-input-${field}`).focus(function() {

            const val = $(this).val();
            const svr_id = $('#node-input-server').find(":selected")[0].value; // extracted each time to account for changes of the server field

            if ( assetId !== undefined ) {

                // specific asset
                let asset;
                if ( typeof assetId === 'object' ) {
                    asset = assetId;
                } else {
                    asset = new (assetClass.get(`${assetType}`))(assetId, "", node_id, svr_id);
                }

                let promise;
                switch (field) {
                    case "property":
                        promise = asset.getProperties();
                        break;
                    case "resource":
                        if ( option === "input" ) promise = asset.getInputResources();
                        else if ( option === "output" ) promise = asset.getOutputResources();
                        else promise = asset.getInputOutputResources();
                        break;
                    case field.match(/^tag/)?.input: // bucket tags
                        promise = asset.getTagValues( field.split('_')[1] );
                        break;
                    case "file":
                        promise = asset.getFiles();
                        break;
                }

                if (promise !== undefined) {
                    promise.then(function(data) {
                        ThingerDOM.showOptions(field, data, val);
                        if ( editor !== undefined ) {
                            $(`#node-input-${field}`).off('change');
                            $(`#node-input-${field}`).change(function() {
                                ThingerDOM.#fillEditor(editor, asset, $(this).val());
                            });
                        }
                    });
                }

            } else {

                // asset family
                let assets = new (assetClass.get(`${option}${assetType}s`))(val, node_id, svr_id);
                assets.getAssets().then(function(data) {
                    ThingerDOM.showOptions(field,data,val,function(value) {
                        // asset filtering callback
                        assets = new (assetClass.get(`${option}${assetType}s`))(value,node_id,svr_id);
                        assets.getAssets().then((data) => {ThingerDOM.showOptions(field, data)});
                    });
                });

            }

        });
    }

    static #fillEditor(editor, asset, assetId) {
        let propertyValue = asset.getPropertyValue( assetId );
        if ( propertyValue !== null ) {
            propertyValue = JSON.stringify(propertyValue,null,'\t');
            editor.setValue(propertyValue);
        }

    }

    // ----------------------- //
    // Basic DOM functionality //
    // ----------------------- //

    static fillSelect(field,options) {

      // Empty select before filling
      $(`#node-input-${field} option:gt(0)`).remove();

        options.forEach((value) => {
            $(`#node-input-${field}`).
              append($('<option>', {
                value: value,
                text: value,
            }));
        });
    }

    static selectOption(field,value) {
        $(`#node-input-${field} option[value='${value}']`).prop('selected', true);
    }

    static addInputField(name, placeholder, field, icon="filter") {

        let lowerName = name.replace('_',' ');
        let capsName = ThingerUtils.capitalize(lowerName);

        let html = `
          <div class='node-row-additional-field'>
            <div class='form-row'>
              <label for="node-input-${name}"><i class="fa fa-${icon}"></i> ${capsName}</label>
              <input type="text" id="node-input-${name}" placeholder="${ThingerUtils.capitalizeFirstLetter(placeholder).replace('_',' ')}">
            </div>
          </div>
        `;
        $(`.node-row-${field}`).before(html);
    }

    static renameInputField(id,value) {
        let Value = ThingerUtils.capitalize(value);

        let icon = $(`.node-row-${id} > div > label > i`);
        let label = $(`.node-row-${id} > div > label`);
        let input = $(`node-row-${id} > div > input`);

        let placeholder = input.prop('placeholder');
        placeholder = `${Value} ${placeholder}`;

        label.empty();
        label.append(icon).append(` ${Value}`);
        label.prop('placeholder', placeholder);
    }

    static changeFieldAppearance(asset,field="assetId") {
        let fieldIcon = $(".node-row-"+field+" > div > label > i");
        let fieldLabel = $(".node-row-"+field+" > div > label");
        let fieldInput = $(".node-row-"+field+" > div > input");
        let placeholder = field === "assetId" ? "Select a X or insert a new one" : "X filter";
        fieldIcon.removeClassStartingWith("fa-").removeClass("fa fas");

        switch (asset) { // TODO: update icons once Node-RED updates from v4.7: https://nodered.org/docs/creating-nodes/appearance#font-awesome-icon
            case 'alarm':
            case 'alarm_rule':
            case 'alarm_instance':
                                  fieldIcon.addClass("fa fa-bell");             break;
            case 'brand':         fieldIcon.addClass("fa fa-paint-brush");      break;
            case 'bucket':        fieldIcon.addClass("fa fa-database");         break;
            case 'claim':         fieldIcon.addClass("fa fa-clipboard");         break;
            case 'dashboard':     fieldIcon.addClass("fa fa-tachometer");       break;
            case 'device':        fieldIcon.addClass("fa fa-rocket");           break;
            case 'domain':        fieldIcon.addClass("fa fa-at");               break;
            case 'endpoint':      fieldIcon.addClass("fa fa-server");           break;
            case 'group':         fieldIcon.addClass("fa fa-th");               break;
            case 'host':          fieldIcon.addClass("fa fa-laptop");           break;
            case 'mqtt':          fieldIcon.addClass("fa fa-wifi");             break;
            case 'oauth':         fieldIcon.addClass("fa fa-window-maximize");  break;
            case 'oauth_client':  fieldIcon.addClass("fa fa-key");              break;
            case 'plugin':        fieldIcon.addClass("fa fa-cube");             break;
            case 'product':       fieldIcon.addClass("fa fa-shopping-bag");     break;
            case 'project':       fieldIcon.addClass("fa fa-folder");           break;
            case 'proxy':         fieldIcon.addClass("fa fa-map-signs");        break;
            case 'role':          fieldIcon.addClass("fa fa-shield");           break;
            case 'storage':       fieldIcon.addClass("fa fa-hdd-o");            break;
            case 'sync':          fieldIcon.addClass("fa fa-refresh");          break;
            case 'tag':           fieldIcon.addClass("fa fa-tag");              break;
            case 'token':         fieldIcon.addClass("fa fa-lock");             break;
            case 'type':          fieldIcon.addClass("fa fa-list-ul");          break;
            case 'user':          fieldIcon.addClass("fa fa-users");            break;
            default:              fieldIcon.addClass("fa fa-filter");           break;
        }

        fieldLabel.empty();
        fieldLabel.append(fieldIcon);
        fieldLabel.append(" ").append(ThingerUtils.capitalize(asset).replace('_',' '));
        fieldInput.prop("placeholder",placeholder.replace('X',ThingerUtils.capitalize(asset).replace('_',' ')));
    }

    // -------------------------------------- //
    // Specific functions for custom frontend //
    // -------------------------------------- //

    static showOptions(field,options,selected,callback) {
        // if its created remove it before creating it again
        if ($('.red-form-options').length !== 0) {
            ThingerDOM.#destroyOptions();
        }

        let addEvents = typeof selected !== 'undefined'; // when showOptions is already a callback of a previous showOptions, event listeners should not be added
        ThingerDOM.#createOptionsDiv(field,callback,addEvents);
        let elements = $();

        options.forEach(option => {
            let element = $("<span>");
            if ((typeof option === 'string' && option === selected) ||
                (typeof option === 'object' &&
                  ((option.id === selected) ||
                   (option.hasOwnProperty("name") && typeof option.name !== 'undefined' && option.name.length !== 0 &&
                    option.name === selected))))
            {
                element.addClass("red-form-option-active");
            } else {
                element.addClass("red-form-option");
            }

            if (typeof option === 'object') {
                if (option.hasOwnProperty('active')) {
                    let icon = $("<i>").addClass("fa fa-circle").addClass(option.active ? "icon-connected" : "icon-disconnected");
                    element.append(icon);
                }
                let id = $("<strong>").text(option.id);
                let name = $("<small>").text(option.name);
                let separator = option.name ? " - ":"";
                element.append(id,separator,name);
            } else {
                let value = $("<strong>").text(option)
                element.append(value);
            }

            elements = elements.add(element);

            // Event handler for each option
            element.click(function() {
                ThingerDOM.#activateOption($(this),field);
            });
        });

        // removing rest of options just before appending to avoid flickering
        $(".red-form-option").remove();
        $(".red-form-option-active").remove();
        $(".red-form-options").append(elements);
        // Set the first option as active if none exist
        if (!$(".red-form-option-active").length) {
            let first = $(".red-form-options span:first-child");
            first.addClass("red-form-option-active");
            first.removeClass("red-form-option");
        }

        // Prefilter option for resources that do not have callback
        if (typeof callback !== "function")
            ThingerDOM.#filterOptions($(`#node-input-${field}`));

    }

    static #createOptionsDiv(field,callback,addEvents) {

        $("<div>").insertAfter(`#node-input-${field}`)
        .addClass("red-form-options");

        // Keep div active while no clicks outside
        $(document).mouseup(function (e) {
            if (!($(".red-form-options").is(e.target) || $(`#node-input-${field}`).is(e.target))// if the target of the click is the container...
            && $(".red-form-options").has(e.target).length === 0) // ... or a descendant of the container
            {
              ThingerDOM.#destroyOptions();
              $(`#node-input-${field}`).off('keydown'); // fallback in case it is destroyed before
            }
        });

        $(`#node-input-${field}`).keydown(function(e) {
            if (e.key === "Tab")
            {
                ThingerDOM.#destroyOptions();
            }
        });

        // Options events
        // TODO: when not callback filtering executing twice
        if (addEvents) {
          $(`#node-input-${field}`).off("keyup");
          $(`#node-input-${field}`).on("keyup", function(e) {
              switch (e.key) {
                  case "Enter":
                    ThingerDOM.#activateOption($(".red-form-option-active"), field);
                    break;
                  case "ArrowUp": {
                    let selected = $(".red-form-option-active");
                    let prev = selected.prev();
                    while (prev.length && prev[0].style.display === "none")
                      prev = prev.prev();
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
                    while (next.length && next[0].style.display === "none")
                      next = next.next();
                    if (next.length) {
                      selected.removeClass("red-form-option-active");
                      selected.addClass("red-form-option");
                      next.removeClass("red-form-option");
                      next.addClass("red-form-option-active");
                    }
                    break;
                  }
                  default: // filtering
                    if (typeof callback === "function") {
                      callback($(this).val());
                    } else {
                      ThingerDOM.#filterOptions($(this));
                    }
              }
          });
        }

    }

    static #destroyOptions() {
        // Remove previously set handlers or the will acumulate
        $(document).off('mouseup');
        $(".red-form-options").remove();
    }

    static #activateOption(obj,field) {
        obj.removeClass("red-form-option");
        obj.addClass("red-form-option-active");

        //  Value to input (needs to be id to work with Node Red model), also fire event just in case
        if (typeof obj.children('strong')[0] !== "undefined") {
            let inputValue = obj.children('strong')[0].innerHTML;

            $(`#node-input-${field}`).val(inputValue);
            $(`#node-input-${field}`).trigger("change",obj);
        }

        // Handle destruction of element
        ThingerDOM.#destroyOptions();
    }

    static #filterOptions(obj) {
        let value = obj.val().toLowerCase();
        let re = new RegExp(value,'g');

        let activeOption = false;

        $("span[class^='red-form-option']").each((index,element) => {
            let id = element.getElementsByTagName('strong')[0].innerHTML.toLowerCase();
            let name = "";
            if (element.children.length >= 3)
                name = element.children[2].innerHTML.toLowerCase();
            else if (element.children.length === 2)
                name = element.children[1].innerHTML.toLowerCase();

            if (id.match(re) || name.match(re)) {
                if (!activeOption) {
                    $(".red-form-option-active").addClass("red-form-option");
                    $(".red-form-option-active").removeClass("red-form-option-active");
                    $(element).addClass("red-form-option-active");
                    activeOption = true;
                }
                element.style.display = "block";
            } else {
                element.style.display = "none";
            }
        });

    }

}
