<?php

/**
 * Implementation of hook_civicrm_buildForm
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_buildForm
 */
function fund_civicrm_buildForm($formName, &$form) {
  $f = '_' . __FUNCTION__ . '_' . $formName;
  if (function_exists($f)) {
    $f($formName, $form);
  }
}

/**
 * Delegated implementation of hook_civicrm_buildForm
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_buildForm
 */
function _fund_civicrm_buildForm_CRM_Contribute_Form_Contribution_Main($formName, &$form) {
  if (_fund_isFormCustomized($form->_id)) {
    CRM_Core_Resources::singleton()->addScriptFile('com.ginkgostreet.civicrm.contribute.fund', 'js/contribute.js', 0, 'html-header');
  }
}

/**
 * This is a stub function; if this extension is genericized to be useful to more orgs,
 * we'll need a function to determine which forms to apply our customizations to.
 *
 * @param mixed $id Int or stingified int representing the form ID
 * @return boolean
 */
function _fund_isFormCustomized($id) {
  return ($id == 8);
}