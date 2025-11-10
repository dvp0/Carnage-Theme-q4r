/**
 * Product Enhancements JavaScript
 * Handles tabs, swatches, and other interactive features
 */

class ProductTabs {
  constructor(container) {
    this.container = container;
    this.tabs = container.querySelectorAll('.product-tab-button');
    this.panels = container.querySelectorAll('.product-tab-panel');

    this.init();
  }

  init() {
    if (!this.tabs.length || !this.panels.length) return;

    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab(index);
      });

      // Keyboard navigation
      tab.addEventListener('keydown', (e) => {
        this.handleKeyboard(e, index);
      });
    });
  }

  switchTab(index) {
    // Update tabs
    this.tabs.forEach((tab, i) => {
      const isActive = i === index;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive);
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    // Update panels
    this.panels.forEach((panel, i) => {
      panel.classList.toggle('active', i === index);
    });
  }

  handleKeyboard(e, currentIndex) {
    let newIndex = currentIndex;

    switch(e.key) {
      case 'ArrowLeft':
        newIndex = currentIndex > 0 ? currentIndex - 1 : this.tabs.length - 1;
        break;
      case 'ArrowRight':
        newIndex = currentIndex < this.tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = this.tabs.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    this.switchTab(newIndex);
    this.tabs[newIndex].focus();
  }
}

class ProductSwatches {
  constructor(container) {
    this.container = container;
    this.swatchInputs = container.querySelectorAll('.swatch-input');
    this.productForm = document.querySelector('product-form');

    this.init();
  }

  init() {
    if (!this.swatchInputs.length) return;

    this.swatchInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.handleSwatchChange(e.target);
      });
    });

    // Set initial selection
    const selectedSwatch = this.container.querySelector('.swatch-input:checked');
    if (!selectedSwatch && this.swatchInputs.length > 0) {
      this.swatchInputs[0].checked = true;
    }
  }

  handleSwatchChange(input) {
    if (!input.checked) return;

    const value = input.value;
    const optionName = input.name;

    // Find the corresponding variant selector
    const variantSelectors = document.querySelectorAll('variant-selects, variant-radios');

    variantSelectors.forEach(selector => {
      const fieldset = selector.querySelector(`fieldset[data-option-name="${optionName}"]`);
      if (!fieldset) return;

      // Find matching input/select
      const radioInput = fieldset.querySelector(`input[value="${value}"]`);
      if (radioInput) {
        radioInput.checked = true;
        radioInput.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }

      const selectInput = fieldset.querySelector('select');
      if (selectInput) {
        const option = Array.from(selectInput.options).find(opt => opt.value === value);
        if (option) {
          selectInput.value = value;
          selectInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });

    // Dispatch custom event
    this.container.dispatchEvent(new CustomEvent('swatch:change', {
      bubbles: true,
      detail: { value, optionName }
    }));
  }

  updateAvailability(variant) {
    // Update swatch availability based on variant
    this.swatchInputs.forEach(input => {
      const swatchItem = input.closest('.swatch-item');
      if (!swatchItem) return;

      // Check if variant with this option is available
      const isAvailable = this.checkVariantAvailability(input.value);

      input.disabled = !isAvailable;
      swatchItem.classList.toggle('swatch-unavailable', !isAvailable);
    });
  }

  checkVariantAvailability(value) {
    // This would need product data to properly check
    // For now, we'll use the disabled attribute from the input
    return true;
  }
}

class StockIndicator {
  constructor(element) {
    this.element = element;
    this.init();
  }

  init() {
    // Listen for variant changes
    document.addEventListener('variant:change', (e) => {
      if (e.detail && e.detail.variant) {
        this.updateStock(e.detail.variant);
      }
    });
  }

  updateStock(variant) {
    if (!variant || !this.element) return;

    const statusElement = this.element.querySelector('.stock-status');
    if (!statusElement) return;

    const textElement = statusElement.querySelector('.stock-text');
    const iconElement = statusElement.querySelector('.stock-icon');

    if (variant.available) {
      statusElement.className = 'stock-status stock-status--in-stock';
      if (textElement) textElement.textContent = 'In stock';

      // Update icon to checkmark
      if (iconElement) {
        iconElement.innerHTML = `
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/>
          <path d="M5 8L7 10L11 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        `;
      }
    } else {
      statusElement.className = 'stock-status stock-status--out';
      if (textElement) textElement.textContent = 'Out of stock';

      // Update icon to X
      if (iconElement) {
        iconElement.innerHTML = `
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/>
          <path d="M10 6L6 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M6 6L10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        `;
      }
    }
  }
}

// Initialize all components when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductEnhancements);
} else {
  initProductEnhancements();
}

function initProductEnhancements() {
  // Initialize product tabs
  const tabContainers = document.querySelectorAll('.product-tabs-wrapper');
  tabContainers.forEach(container => {
    new ProductTabs(container);
  });

  // Initialize product swatches
  const swatchContainers = document.querySelectorAll('.product-variant-swatches');
  swatchContainers.forEach(container => {
    new ProductSwatches(container);
  });

  // Initialize stock indicators
  const stockIndicators = document.querySelectorAll('.product-stock-indicator');
  stockIndicators.forEach(indicator => {
    new StockIndicator(indicator);
  });
}

// Re-initialize when sections are updated (Shopify theme editor)
if (Shopify && Shopify.designMode) {
  document.addEventListener('shopify:section:load', () => {
    initProductEnhancements();
  });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ProductTabs,
    ProductSwatches,
    StockIndicator
  };
}
