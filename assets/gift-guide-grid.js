document.addEventListener('DOMContentLoaded', function() {
    var popup = document.getElementById('gift-popup');
    var popupImage = document.getElementById('gift-popup-image');
    var popupTitle = document.getElementById('gift-popup-title');
    var popupDescription = document.getElementById('gift-popup-description');
    var popupprice = document.getElementById('gift-popup-price');

    var plusButtons = document.querySelectorAll('.gift-grid__plus-btn');
    var closeTrigger = document.querySelectorAll('[data-popup-close]');

    // Function to open the popup with the corresponding gift details when "+" button is clicked
    plusButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            var handle = button.getAttribute('data-product-handle');
            if (!handle) return;

            fetch(`/products/${handle}.js`)
                .then(function(response) {
                    return response.json();
                })
                .then(function(product) {
                    openPopup(product);
                })
                .catch(function(error) {
                    console.error('Failed to load product data:', error);
                });
        });     
        
    });

    //Function to fill the popup with product data and display it
    function openPopup(product) {
        popupImage.src = product.featured_image;
        popupImage.alt = product.title;
        popupTitle.textContent = product.title;
        popupDescription.innerHTML = product.description;
        popupprice.textContent = formatMoney(product.price);

        popup.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }   

    // Function to close the popup when the close button is clicked
    function closePopup() {
        popup.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = ''; // Restore background scrolling
    }

    closeTrigger.forEach(function(trigger) {
        trigger.addEventListener('click', closePopup);
    });

    //close on escape key press
    document.addEventListener('keydown', function(e) {
        if(e.key == 'Escape') {
            closePopup();
        }
    });

    //convert cents to a formatted price string
    function formatMoney(cents) {
        var amount = (cents / 100).toFixed(2);
        return amount + '€';
    }
});
