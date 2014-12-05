cj(function($) {
  // create container for our custom UI and move in the amount selector
  $("#priceset-div").before($('<div>', {class: 'fund_container'}));
  $('.fund_container').append($('.crm-section.amount_template-section'));
  $('.crm-section.amount_template-section input[value=0]').closest('.price-set-row').hide();
  var selectOther = buildSelectOther();
  $('.fund_container .amount_template-section .content').append(selectOther);
  $('[name=price_84]').change(function(){
    if ($(this).is('#price_toggle_other')) {
      $('.price_other_wrapper').show();
    } else {
      $('.price_other_wrapper').hide();
    }
  });

  // hide the CiviCRM-generated price set
  $("#priceset-div").hide();

  // if the hidden fields are populated on page load (e.g., after a validation error) build the allocations table
  $('#priceset-div input[name^=price_][type=text]').each(function(){
    var field = $(this);
    if (field.val() > 0) {
      updateAllocationsTable(field.attr('name'));
    }
  });

  // build the custom UI for selecting funds
  var funds = buildFundList();
  var select = buildSelectList('fund_selector', 'Select a Fund to which to Contribute', funds);
  var button = buildButton();
  $('.fund_container').prepend(select);
  $('.fund_container .crm-section.amount_template-section').after(button);

  // prepopulate the select box with the appropriate fund if passed via the URL
  var params = getUrlParams();
  if (params.hasOwnProperty('fund')) {
    select.find('option[value=price_' + params.fund + ']').attr('selected', true);
  }

  // if the user submits the form with a ready-to-go allocation (but neglects to click the
  // "add" button), add/update the line-item before submitting
  $('form[name=Main]').submit(function(){
    if ($('.amount_template-section :radio:checked').length === 1) {
      handleAllocation();
    }
  });

  /**
   * Parses query string. Turns ?foo=bar&apples=oranges into {foo: 'bar', apples: 'oranges'}
   *
   * @returns {Object}
   */
  function getUrlParams() {
    var qs = window.location.search.substring(1); // use substring to drop the ?
    var pairs = qs.split('&');
    var params = {};
    $.each(pairs, function(){
      var p = this.split('=');
      params[p[0]] = p[1];
    });

    return params;
  }

  /**
   * Builds the select-other widget
   *
   * @returns {jQuery object}
   */
  function buildSelectOther() {
    return $('<div>', {class: 'price-set-row'})
      .append($('<span>', {class: 'price-set-option-content'})
        .append($('<input>', {
          'data-amount': 'other',
          id: 'price_toggle_other',
          name: 'price_84',
          type: 'radio',
          value: 'other'
        }))
        .append($('<label>', {
          for: 'price_toggle_other',
          text: 'Other'
        }))
      )
      .append($('<div>', {
        class: 'price_other_wrapper',
        style: 'display: none;'
      })
        .append($('<input>', {
          keyup: function() {
            // set the amount in the hidden field
            var amt = $(this).val();
            var real_field = $('select[name="fund_selector"]').val();
            $('#priceset-div input[name=' + real_field + ']').val(amt);
          },
          name: 'price_other'
        }))
      );
  }

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
      text: 'Add Contribution'
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
    if (amt === 'other') {
      amt = $('[name=price_other]').val();
    }

    if (typeof amt === "undefined") {
      CRM.alert('Please select a gift amount', 'Error', 'error');
    } else {
      // uncheck our amount picker so it doesn't get counted twice in the total
      $('.amount_template-section :radio:checked').prop('checked', false);
      $('[name=price_other]').val('');

      // set the amount in the hidden field
      $('#priceset-div input[name=' + real_field + ']').val(amt);

      updateAllocationsTable(real_field);
    }
  }

  /**
   * Updates the allocations display. This approach was taken to preserve the order
   * in which allocations were made; were it not for this, we would build the table from
   * scratch each time a hidden field is updated.
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
            class: 'removeAllocation icon delete-icon',
            click: removeAllocation,
            style: 'cursor: pointer;',
            title: 'Remove Contribution'
          }))
        )
      );
    }

    // whether adding or updating the row, display the gift amount
    $('table.fund_allocations tbody tr[data-id=' + real_field + '] td.amt').text(line_item.amt_formatted);

    var total = sumAllocations();
    var formatted = fMoney(total);
    $('table.fund_allocations tfoot th.total').text(formatted);
  }

  /**
   * Click handler. Removes an allocation from both the display and the hidden form.
   *
   * @param e Click event
   */
  function removeAllocation(e) {
    var row = $(e.currentTarget).closest('tr');

    // unset the amount in the hidden field
    $('#priceset-div input[name=' + row.attr('data-id') + ']').val();

    row.remove();

    var total = sumAllocations();
    var formatted = fMoney(total);
    $('table.fund_allocations tfoot th.total').text(formatted);
  }

  /**
   * Sums the allocations as represented in the hidden, CiviCRM-generated form. As it is this form which
   * will be submitted to the server, this is the most accurate way to calculate the total.
   *
   * @returns {Number}
   */
  function sumAllocations() {
    var total = 0;
    $('table.fund_allocations tbody tr[data-id]').each(function() {
      var real_field = $(this).attr('data-id');
      var line_item = getRealFieldData(real_field);
      total = Number(line_item.amt_raw) + total;
    });

    return total;
  }

  /**
   * Formats the passed total.
   *
   * @param {Number} total Unformatted amount of money
   * @returns {String} Formatted amount of money
   */
  function fMoney(total) {
    // the function and global vars below are provided by CiviCRM's contribution form template
    return symbol + formatMoney(total, 2, seperator, thousandMarker);
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
      amt_formatted: fMoney(amt_raw),
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