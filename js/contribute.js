cj(function($) {
  // create container for our custom UI and move in the amount selector
  $("#priceset-div").before($('<div>', {class: 'fund_container'}));
  $('.fund_container').append($('.crm-section.amount_template-section'));

  // hide the CiviCRM-generated price set
  $("#priceset-div").hide();

  var funds = buildFundList();
  var select = buildSelectList('fund_selector', 'Select a Fund to which to Contribute', funds);
  var button = buildButton();
  $('.fund_container').prepend(select).append(button);

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
      click: handleAllocation,
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

  /**
   * Handles the "submit" of the allocations "form"
   */
  function handleAllocation() {
    var real_field = $('select[name="fund_selector"]').val();
    var amt = $('.amount_template-section :radio:checked').data('amount');

    if (typeof amt === "undefined") {
      CRM.alert('Please select a gift amount', 'Error', 'error');
    } else {
      // uncheck our amount picker so it doesn't get counted twice in the total
      $('.amount_template-section :radio:checked').prop('checked', false);

      // set the amount in the hidden field
      $('#priceset-div input[name=' + real_field + ']').val(amt);

      updateAllocationsTable(real_field);
    }
  }

  /**
   * Updates the allocations display
   *
   * @param {string} real_field The allocation to add or update
   */
  function updateAllocationsTable(real_field) {
    if ($('table.fund_allocations').length === 0) {
      var allocationsTable = buildAllocationsTable();
      $('.fund_container').append(allocationsTable);
    }

    /*
     * Because we're just putting window dressing on the existing form, we can support
     * only one gift per given fund. Therefore, we must check to see if there's
     * already a row for the fund in the table before adding it.
     */
    var line_item = getRealFieldData(real_field);
    if ($('table.fund_allocations tbody tr[data-id=' + real_field + ']').length === 0) {
      $('table.fund_allocations tbody').append($('<tr>')
        .attr('data-id', real_field)
        .append($('<td>', {class: 'fund', text: line_item.fund_label}))
        .append($('<td>', {class: 'amt'}))
        .append($('<td>')
          .append($('<span>', {
            class: 'removeAllocation crm-button',
            click: function() {alert('remove me');},
            text: 'X'
          }))
        )
      );
    }

    // whether adding or updating the row, display the gift amount
    $('table.fund_allocations tbody tr[data-id=' + real_field + '] td.amt').text(line_item.amt_label);

    // TODO: call summing function
  }

  /**
   * Retrieves data from the hidden, CiviCRM-generated form, which we are using as our
   * client-side data store.
   *
   * @param {type} name The name of the hidden field
   * @returns {Object}
   */
  function getRealFieldData(name) {
    var section = $('#priceset-div input[name=' + name + ']').closest('.crm-section');
    var amt_raw = section.find('input').val();

    return {
      amt_label: $('.amount_template-section :radio[data-amount=' + amt_raw + ']').siblings('label').text(),
      'amt_raw': amt_raw,
      fund_label: section.find('label').text(),
      real_field: name
    };
  }

  /**
   * @returns {jQuery object} A skeletal allocations table
   */
  function buildAllocationsTable() {
    return $('<table>', {class: 'fund_allocations'})
      .append($('<thead>')
        .append($('<tr>')
          .append($('<th>', {class: 'fund', text: 'Fund'}))
          .append($('<th>', {class: 'amt', text: 'Amount'}))
          .append($('<th>'))
        )
      )
      .append($('<tfoot>')
        .append($('<tr>')
          .append($('<th>', {text: 'Total Contribution'}))
          .append($('<th>', {class: 'total', text: 0}))
          .append($('<th>'))
        )
      )
      .append($('<tbody>'));
  }
});