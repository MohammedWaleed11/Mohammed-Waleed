

document.addEventListener('DOMContentLoaded', function () {
  var popup = document.getElementById('gift-popup');
  var popupImage = document.getElementById('gift-popup-image');
  var popupTitle = document.getElementById('gift-popup-title');
  var popupPrice = document.getElementById('gift-popup-price');
  var popupDescription = document.getElementById('gift-popup-description');
  var colorWrapper = document.getElementById('gift-popup-color-wrapper');
  var colorSwatches = document.getElementById('gift-popup-color-swatches');
  var sizeWrapper = document.getElementById('gift-popup-size-wrapper');
  var sizeSelect = document.getElementById('gift-popup-size-select');
  var addToCartBtn = document.getElementById('gift-popup-add-to-cart');
  var addToCartText = document.getElementById('gift-popup-add-to-cart-text');

  var plusButtons = document.querySelectorAll('.gift-grid__plus-btn');
  var closeTriggers = document.querySelectorAll('[data-popup-close]');

  // Holds the currently loaded product and selected option values
  var currentProduct = null;
  var selectedOptions = {}; // e.g. { Color: "Black", Size: "Medium" }

  plusButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var handle = button.getAttribute('data-product-handle');
      if (!handle) return;

      fetch('/products/' + handle + '.js')
        .then(function (response) {
          return response.json();
        })
        .then(function (product) {
          openPopup(product);
        })
        .catch(function (error) {
          console.error('Failed to load product:', error);
        });
    });
  });

  function openPopup(product) {
    currentProduct = product;
    selectedOptions = {};

    popupImage.src = product.featured_image;
    popupImage.alt = product.title;
    popupTitle.textContent = product.title;
    popupDescription.innerHTML = product.description;

    buildOptions(product);
    updateSelectedVariant();

    popup.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  // Build the Color swatches and Size dropdown based on the product's real options
  function buildOptions(product) {
    colorSwatches.innerHTML = '';
    sizeSelect.innerHTML = '<option value="">Choose your size</option>';
    colorWrapper.style.display = 'none';
    sizeWrapper.style.display = 'none';

    product.options.forEach(function (option) {
      if (option.name.toLowerCase() === 'color') {
        colorWrapper.style.display = '';
        option.values.forEach(function (value) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'gift-popup__swatch';
          btn.textContent = value;
          btn.setAttribute('data-value', value);
          btn.addEventListener('click', function () {
            selectOption('Color', value, colorSwatches, btn);
          });
          colorSwatches.appendChild(btn);
        });
      }

      if (option.name.toLowerCase() === 'size') {
        sizeWrapper.style.display = '';
        option.values.forEach(function (value) {
          var opt = document.createElement('option');
          opt.value = value;
          opt.textContent = value;
          sizeSelect.appendChild(opt);
        });
      }
    });
  }

  function selectOption(optionName, value, container, clickedBtn) {
    selectedOptions[optionName] = value;

    var allSwatches = container.querySelectorAll('.gift-popup__swatch');
    allSwatches.forEach(function (swatch) {
      swatch.classList.remove('is-selected');
    });
    clickedBtn.classList.add('is-selected');

    updateSelectedVariant();
  }

  sizeSelect.addEventListener('change', function () {
    if (sizeSelect.value) {
      selectedOptions['Size'] = sizeSelect.value;
    } else {
      delete selectedOptions['Size'];
    }
    updateSelectedVariant();
  });

  function updateSelectedVariant() {
    if (!currentProduct) return;

    var matchedVariant = currentProduct.variants.find(function (variant) {
      return currentProduct.options.every(function (option, index) {
        var selectedValue = selectedOptions[option.name];
        if (!selectedValue) return false;
        return variant.options[index] === selectedValue;
      });
    });

    if (matchedVariant) {
      popupPrice.textContent = formatMoney(matchedVariant.price);
      addToCartBtn.disabled = !matchedVariant.available;
      addToCartText.textContent = matchedVariant.available ? 'Add to cart' : 'Sold out';
      addToCartBtn.setAttribute('data-variant-id', matchedVariant.id);
    } else {
      popupPrice.textContent = formatMoney(currentProduct.price);
      addToCartBtn.disabled = true;
      addToCartText.textContent = 'Select options';
      addToCartBtn.removeAttribute('data-variant-id');
    }
  }

  function closePopup() {
    popup.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  closeTriggers.forEach(function (trigger) {
    trigger.addEventListener('click', closePopup);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closePopup();
    }
  });

  function formatMoney(cents) {
    var amount = (cents / 100).toFixed(2);
    return amount + '€';
  }
  addToCartBtn.addEventListener('click', function (e) {
    e.preventDefault();//prevents the button from refreshing the page
    var variantId = addToCartBtn.getAttribute('data-variant-id');
    if (!variantId) {
        console.error('No variant found. Please select options.');
        return;     
    }
    //Temporarily disable the button to prevent multiple clicks
    addToCartText.textContent = 'Adding...';
    addToCartBtn.disabled = true;

    //check if the selected option triggers the specific test rule
    var isBlack = selectedOptions['Color'] === 'Black';
    var isMedium = selectedOptions['Size'] === 'Medium' || selectedOptions['Size'] === 'M';

    if (isBlack && isMedium) {
        // If the selected options match the test rule, redirect to the specific URL
        fetch('/products/soft-winter-jacket.js')
            .then(function (response) {
                if (!response.ok)  throw new Error('Jacket fetch failed');
                return response.json();
            })
            .then(function (jacketProduct) {
                var jacketVariantId = jacketProduct.variants[0].id;

                //Send BOTH the jacket and the selected variant to the cart
                sendtoCart([
                    { id: jacketVariantId, quantity: 1 },
                    { id: variantId, quantity: 1 }
                ]);
            })
            .catch(function (error) {
                console.error('Jacket product not found in store. Adding only main item', error);
                sendtoCart([{ id: variantId, quantity: 1 }]);
            });
    } else {
        // If the selected options do not match the test rule, add only the selected variant to the cart
        sendtoCart([{ id: variantId, quantity: 1 }]);
    }

    //Helper function to handle the actual shopify AJAX request to add items to the cart
    function sendtoCart(itemsArray) {
        fetch('/cart/add.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items: itemsArray })
        })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            //success!
            addToCartText.textContent = 'Added to cart';
            
            //Reset the button after 2 seconds
            setTimeout(function () {
                addToCartText.textContent = 'Add to cart';
                addToCartBtn.disabled = false;
            }, 2000);
        })
        .catch(function (error) {
            console.error('Error adding to cart:', error);
            addToCartText.textContent = 'Error. Try again.';
            addToCartBtn.disabled = false;
        });
        }
    });
});