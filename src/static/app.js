document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and dropdown options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = ""; // Clear previous options

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Add "View Participants" button
        const viewBtn = document.createElement("button");
        viewBtn.textContent = "View Participants";
        viewBtn.style.marginTop = "8px";
        viewBtn.type = "button";

        // Participants list element
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants-list hidden";

        viewBtn.addEventListener("click", async () => {
          if (!participantsDiv.classList.contains("hidden")) {
            participantsDiv.classList.add("hidden");
            viewBtn.textContent = "View Participants";
            return;
          }
          viewBtn.textContent = "Hide Participants";
          participantsDiv.innerHTML = "<p>Loading participants...</p>";
          participantsDiv.classList.remove("hidden");
          try {
            const resp = await fetch(`/activities/${encodeURIComponent(name)}/participants`);
            if (!resp.ok) throw new Error("Failed to fetch participants");
            const data = await resp.json();
            // Defensive: handle missing or malformed data
            if (data && Array.isArray(data.participants) && data.participants.length > 0) {
              participantsDiv.innerHTML = `
                <ul>
                  ${data.participants.map(email => `<li>${email}</li>`).join("")}
                </ul>
              `;
            } else if (data && Array.isArray(data.participants) && data.participants.length === 0) {
              participantsDiv.innerHTML = "<p>No participants yet.</p>";
            } else {
              participantsDiv.innerHTML = "<p>Participants data unavailable.</p>";
            }
          } catch (err) {
            participantsDiv.innerHTML = `<p>Error loading participants: ${err.message}</p>`;
            console.error("Error loading participants:", err);
          }
        });

        activityCard.appendChild(viewBtn);
        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to update spots left after signup
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
