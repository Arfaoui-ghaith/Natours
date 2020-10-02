/* eslint-disable */
const stripe = Stripe(
  'pk_test_51HXQa3I3hXzEYErN3Yu9wf02IrxBaXkSD24x2NkG0nrr6DtdcrwFFClk5vEGjGOalJZDz38ofXIFrV6SMIRJfhm900iKW4OBWZ'
); // public key

const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

// type is 'success' or 'error'
const showAlert = (type, msg) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 5000);
};

const bookTour = async (tourId) => {
  try {
    // 1) get the checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);

    // 2) Create checkout form + process credit card

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};

const bookBtn = document.getElementById('book-tour');

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const tourId = e.target.dataset.tourId;
    console.log(tourId);
    bookTour(tourId);
  });
}
