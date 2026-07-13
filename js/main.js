// ============================================
// Hello Home Buyers - Shared Site Behavior
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  initNavToggle();
  initAccordions();
  initStarSelectors();
  initReviewsPage();
  initApiForms();
});

/* ---------- Mobile nav ---------- */
function initNavToggle() {
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", function () {
    var isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

/* ---------- FAQ / generic accordions ---------- */
function initAccordions() {
  var triggers = document.querySelectorAll(".accordion-trigger");
  triggers.forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      var panelId = trigger.getAttribute("aria-controls");
      var panel = document.getElementById(panelId);
      var expanded = trigger.getAttribute("aria-expanded") === "true";

      trigger.setAttribute("aria-expanded", expanded ? "false" : "true");
      if (panel) panel.classList.toggle("open", !expanded);
    });
  });
}

/* ---------- Star rating selector (Leave a Review form) ---------- */
function initStarSelectors() {
  var groups = document.querySelectorAll(".star-select");
  groups.forEach(function (group) {
    var hiddenInput = document.getElementById(group.getAttribute("data-input"));
    var buttons = group.querySelectorAll("button");

    buttons.forEach(function (btn, index) {
      btn.addEventListener("click", function () {
        var value = index + 1;
        if (hiddenInput) hiddenInput.value = value;

        buttons.forEach(function (b, i) {
          b.classList.toggle("active", i < value);
          b.setAttribute("aria-pressed", i < value ? "true" : "false");
        });
      });
    });
  });
}

/* ---------- Reviews page: load + filter + render ---------- */
function initReviewsPage() {
  var list = document.getElementById("reviews-list");
  if (!list) return; // not on the reviews page

  var filterForm = document.getElementById("review-filters");
  var allReviews = [];

  fetch("data/reviews.json")
    .then(function (res) {
      if (!res.ok) throw new Error("Unable to load reviews");
      return res.json();
    })
    .then(function (reviews) {
      allReviews = reviews.filter(function (r) {
        return r.status === "published";
      });
      renderReviews(allReviews);
    })
    .catch(function () {
      renderReviews([]);
    });

  if (filterForm) {
    filterForm.addEventListener("change", function () {
      var rating = filterForm.rating.value;
      var city = filterForm.city.value;
      var propertyType = filterForm.propertyType.value;
      var verifiedOnly = filterForm.verifiedOnly.checked;

      var filtered = allReviews.filter(function (r) {
        if (rating && String(r.rating) !== rating) return false;
        if (city && r.city !== city) return false;
        if (propertyType && r.propertyType !== propertyType) return false;
        if (verifiedOnly && !r.verified) return false;
        return true;
      });

      renderReviews(filtered);
    });
  }

  function renderReviews(reviews) {
    list.innerHTML = "";

    if (!reviews.length) {
      list.innerHTML =
        '<div class="empty-state">' +
        "<h3>No reviews match yet</h3>" +
        "<p>As sellers complete transactions with us and choose to share their experience, verified reviews will appear here.</p>" +
        "</div>";
      return;
    }

    reviews.forEach(function (r) {
      var card = document.createElement("article");
      card.className = "review-card";

      var stars = "★★★★★☆☆☆☆☆".slice(5 - r.rating, 10 - r.rating);

      var badge = r.verified
        ? '<span class="badge-verified">✓ Verified Seller</span>'
        : '<span class="badge-pending">Unverified</span>';

      var response = "";
      if (r.response && r.response.text) {
        response =
          '<div class="review-response">' +
          '<span class="response-label">Response from ' +
          escapeHtml(r.response.responder || "Hello Home Buyers") +
          "</span>" +
          escapeHtml(r.response.text) +
          "</div>";
      }

      card.innerHTML =
        '<div class="stars" aria-label="' + r.rating + ' out of 5 stars">' + stars + "</div>" +
        "<p>" + escapeHtml(r.reviewText) + "</p>" +
        '<div class="review-meta">' +
        "<strong>" + escapeHtml(r.firstName) + " " + escapeHtml(r.lastInitial) + ".</strong>" +
        "<span>" + escapeHtml(r.city || "") + "</span>" +
        "<span>" + escapeHtml(r.propertyType || "") + "</span>" +
        "<span>Closed " + escapeHtml(r.closingMonthYear || "") + "</span>" +
        badge +
        "</div>" +
        response;

      list.appendChild(card);
    });
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }
}

/* ---------- Forms wired to the in-house API (contact, request-an-offer, leave-a-review) ---------- */
function initApiForms() {
  var forms = document.querySelectorAll("form[data-api]");
  forms.forEach(function (form) {
    var statusEl = document.getElementById(form.getAttribute("data-status"));
    var submitBtn = form.querySelector('button[type="submit"]');
    var originalBtnText = submitBtn ? submitBtn.textContent : "";

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
      }
      if (statusEl) {
        statusEl.hidden = true;
        statusEl.classList.remove("error");
      }

      fetch(form.getAttribute("data-api"), {
        method: "POST",
        body: new FormData(form),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok && data.ok, error: data.error };
          });
        })
        .then(function (result) {
          if (!statusEl) return;
          statusEl.hidden = false;
          if (result.ok) {
            statusEl.classList.remove("error");
            statusEl.textContent =
              "Thanks — we've received your submission and will be in touch.";
            form.reset();
          } else {
            statusEl.classList.add("error");
            statusEl.textContent =
              result.error ||
              "Something went wrong. Please try again or contact us directly.";
          }
        })
        .catch(function () {
          if (statusEl) {
            statusEl.hidden = false;
            statusEl.classList.add("error");
            statusEl.textContent =
              "Something went wrong. Please check your connection and try again.";
          }
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
          }
        });
    });
  });
}
