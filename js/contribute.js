cj(function($) {
  // hide the CiviCRM-generated price set
  $("#priceset-div input[name^=price_]").closest('.crm-section').hide();

  $("#pricesetTotal").before('<div class="fund_container"></div>');

  var funds = buildFundList();
  var select = buildSelectList('fund_selector', 'Select a Fund to which to Contribute', funds);
  var button = buildButton();
  $('.fund_container').prepend(select)
    .append($('.crm-section.amount_template-section').show())
    .append(button);

  /**
   * Parses the CiviCRM-generated price set to build a list of funds
   *
   * @returns {Array} of fund objects with properties field_name and label
   */
  function buildFundList() {
    var funds = [];

    $("#priceset-div input[name^=price_]").each(function () {
      var input = $(this);
      funds.push({
        field_name: input.attr("name"),
        label: input.closest('.crm-section').find('label').text()
      });
    });

    return funds;
  }

  /**
   * @param {String} name Machine name to give the select box
   * @param {String} label The label for the select box
   * @param {Array} options Result of buildFundList
   * @returns {jQuery Object} The select list, its label, and their wrappers
   */
  function buildSelectList(name, label, options) {
    var output = $('<div>', {
      class: 'crm-section ' + name + '_wrapper'
    }).append($('<div>', {
        class: 'label'
      }))
      .append($('<div>', {
        class: 'content'
      }))
      .append($('<div>', {
        class: 'clear'
      }));

    var select = $('<select>', {
      name: name
    });

    $.each(options, function(k, v) {
      select.append('<option value="' + v.field_name + '">' + v.label + '</option>');
    });

    $(output).find('.label').append('<label>' + label + '</label>');
    $(output).find('.content').append(select);

    return output;
  }

  /**
   * @returns {jQuery object} The button and wrappers
   */
  function buildButton() {
    var button = $('<span>', {
      click: function() {alert('hey!');},
      style: 'padding: 2px 4px;',
      text: 'Add Contribution',
    });

    var span = $('<span>', {
      class: 'crm-button'
    }).append(button);

    return $('<div>', {
      class: 'crm-submit-buttons',
      style: 'margin-left: 19%;'
    }).append(span);
  }
});