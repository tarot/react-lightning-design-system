import React, { PropTypes, Component } from 'react';
import classnames from 'classnames';
import uuid from 'uuid';
import FormElement from './FormElement';
import Icon from './Icon';
import Button from './Button';
import { default as DropdownMenu, DropdownMenuItem } from './DropdownMenu';


export default class Picklist extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: `form-element-${uuid()}`,
      opened: props.defaultOpened,
      value: props.defaultValue,
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.onValueChange && prevState.value !== this.state.value) {
      this.props.onValueChange(this.state.value, prevState.value);
    }
  }

  onClick = () => {
    this.setState({ opened: !this.state.opened });
    setTimeout(() => {
      this.focusToTargetItemEl();
    }, 10);
  };

  onPicklistItemClick = (item, e) => {
    const { multiSelect } = this.props;
    this.updateItemValue(item.value);

    if (this.props.onChange) {
      this.props.onChange(e, item.value);
    }
    if (this.props.onSelect) {
      this.props.onSelect(item);
    }
    if (!multiSelect) {  // close if only single select
      setTimeout(() => {
        this.setState({ opened: false });
        if (this.props.onComplete) {
          this.props.onComplete();
        }
        const picklistButtonEl = this.picklistButton;
        if (picklistButtonEl) {
          picklistButtonEl.focus();
        }
      }, 200);
    }
    e.preventDefault();
    e.stopPropagation();
  };

  onPicklistClose = () => {
    const picklistButtonEl = this.picklistButton;
    picklistButtonEl.focus();
    this.setState({ opened: false });
  };

  onBlur = () => {
    setTimeout(() => {
      if (!this.isFocusedInComponent()) {
        this.setState({ opened: false });
        if (this.props.onBlur) {
          this.props.onBlur();
        }
        if (this.props.onComplete) {
          this.props.onComplete();
        }
      }
    }, 10);
  };

  onKeydown = (e) => {
    if (e.keyCode === 40) { // down
      e.preventDefault();
      e.stopPropagation();
      if (!this.state.opened) {
        this.setState({ opened: true });
        setTimeout(() => {
          this.focusToTargetItemEl();
        }, 10);
      } else {
        this.focusToTargetItemEl();
      }
    } else if (e.keyCode === 27) { // ESC
      e.preventDefault();
      e.stopPropagation();
      this.setState({ opened: false });
      if (this.props.onComplete) {
        this.props.onComplete();
      }
    }
    if (this.props.onKeyDown) {
      this.props.onKeyDown(e);
    }
  };

  getSelectedItemLabel() {
    const selectedValues = this.state.value;

    // many items selected
    if (selectedValues.length > 1) {
      return `${selectedValues.length} Options selected`;
    }

    // one item or zero
    if (selectedValues.length === 1) {
      const selectedValue = selectedValues[0];
      let selected = null;
      React.Children.forEach(this.props.children, (item) => {
        if (item.props.value === selectedValue) {
          selected = item.props.label || item.props.children;
        }
      });
      return (selected || this.props.selectedText);
    }

    return this.props.selectedText;
  }

  updateItemValue(itemValue) {
    const { multiSelect } = this.props;

    if (multiSelect) {
      const newValue = this.state.value.slice();

      // toggle value
      if (this.state.value.indexOf(itemValue) === -1) {
        // add value to array
        newValue.push(itemValue);
      } else {
        // remove from array
        newValue.splice(newValue.indexOf(itemValue), 1);
      }
      this.setState({ value: newValue });
    } else {
      // set only one value
      this.setState({ value: [itemValue] });
    }
  }

  isFocusedInComponent() {
    const rootEl = this.node;
    let targetEl = document.activeElement;
    while (targetEl && targetEl !== rootEl) {
      targetEl = targetEl.parentNode;
    }
    return !!targetEl;
  }

  focusToTargetItemEl() {
    const dropdownEl = this.dropdown;
    const firstItemEl =
      dropdownEl.querySelector('.slds-is-selected > .react-slds-menuitem[tabIndex]') ||
      dropdownEl.querySelector('.react-slds-menuitem[tabIndex]');
    if (firstItemEl) {
      firstItemEl.focus();
    }
  }

  renderPicklist(props) {
    const { className, id, ...pprops } = props;
    const picklistClassNames = classnames(className, 'slds-picklist');
    delete pprops.onValueChange;
    return (
      <div className={ picklistClassNames } aria-expanded={ this.state.opened }>
        <Button
          id={ id }
          buttonRef={ node => (this.picklistButton = node) }
          className='slds-picklist__label'
          type='neutral'
          onClick={ this.onClick }
          onBlur={ this.onBlur }
          onKeyDown={ this.onKeydown }
        >
          <span className='slds-truncate'>
            { this.getSelectedItemLabel() || <span>&nbsp;</span> }
          </span>
          <Icon icon='down' />
        </Button>
      </div>
    );
  }

  renderDropdown(menuSize) {
    const { children } = this.props;
    return (
      this.state.opened ?
        <DropdownMenu
          dropdownMenuRef={ node => (this.dropdown = node) }
          size={ menuSize }
          onMenuItemClick={ this.onPicklistItemClick }
          onMenuClose={ this.onPicklistClose }
        >
          { React.Children.map(children, this.renderPicklistItem) }
        </DropdownMenu> :
          <div ref={ node => (this.dropdown = node) } />
    );
  }

  renderPicklistItem(item) {
    const selected = this.state.value.indexOf(item.props.value) !== -1;
    const onBlur = this.onBlur;
    return React.cloneElement(item, { selected, onBlur });
  };

  render() {
    const id = this.props.id || this.state.id;
    const { label, required, error, totalCols, cols, menuSize, ...props } = this.props;
    const dropdown = this.renderDropdown(menuSize);
    const formElemProps = { id, label, required, error, totalCols, cols, dropdown };
    return (
      <FormElement formElementRef={ node => (this.node = node) } { ...formElemProps }>
        { this.renderPicklist({ ...props, id }) }
      </FormElement>
    );
  }
}

Picklist.propTypes = {
  id: PropTypes.string,
  className: PropTypes.string,
  label: PropTypes.string,
  required: PropTypes.bool,
  multiSelect: PropTypes.bool,
  error: FormElement.propTypes.error,
  totalCols: PropTypes.number,
  cols: PropTypes.number,
  name: PropTypes.string,
  defaultValue: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ])),
  selectedText: PropTypes.string,
  defaultOpened: PropTypes.bool,
  onChange: PropTypes.func,
  onValueChange: PropTypes.func,
  onSelect: PropTypes.func,
  onComplete: PropTypes.func,
  onKeyDown: PropTypes.func,
  onBlur: PropTypes.func,
  menuSize: PropTypes.string,
  children: PropTypes.node,
};

Picklist.defaultProps = {
  multiSelect: false,
  defaultValue: [],
  selectedText: 'Select an Option',
};


Picklist.isFormElement = true;


export const PicklistItem = ({ label, selected, children, ...props }) => (
  <DropdownMenuItem
    icon={ selected ? 'check' : 'none' }
    role='menuitemradio' // eslint-disable-line
    selected={ selected }
    { ...props }
  >
    { label || children }
  </DropdownMenuItem>
);

PicklistItem.propTypes = {
  label: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  selected: PropTypes.bool,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  children: PropTypes.node,
};
