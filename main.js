
    // Initialize Supabase client config
    const supabaseUrl = "https://timhflcxsmjlyqjnymrm.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpbWhmbGN4c21qbHlxam55bXJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MjU2MTksImV4cCI6MjA2MDQwMTYxOX0.cbZUGdOZrQ14mVf5685U6gFCe7AnX-nGHU4Joxa48Z8";
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    let allData = [];

    
    // Initialize Chart.js bar chart
    const ctx = document.getElementById("brushChart").getContext("2d");
    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [],
        datasets: [{
          label: "Duration (sec)",
          data: [],
          backgroundColor: "rgba(54, 162, 235, 0.6)"
        }]
      },
      options: {
        scales: {
          x: {
            title: {
              display: true,
              text: "Date & Time"
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Duration (sec)"
            }
          }
        }
      }
    });

    // Login validation logic
    function login() {
      const user = document.getElementById('username').value;
      const pass = document.getElementById('password').value;
      if (user === 'Maxi' && pass === '12345') {
        document.getElementById('loginOverlay').style.display = 'none';
        fetchData();
        document.getElementById('deviceStatus').textContent = '🟢 Connected as Maxi';
      } else {
        alert('Incorrect credentials. Try again.');
      }
    }

    // Fetch brushing data from Supabase
    async function fetchData() {
      const status = document.getElementById("status");
      status.textContent = "Loading data...";

      const { data, error } = await supabase
        .from("brush_records")
        .select("*")
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("Error fetching data:", error.message);
        status.textContent = "❌ Failed to load data.";
        return;
      }

      if (!data || data.length === 0) {
        status.textContent = "No data available.";
        return;
      }

      allData = data.map(row => ({
        timestamp: row.timestamp,
        duration: row.duration,
        device: row.device
      }));

      updateChart(allData);
    }

    // Filter brushing records based on time range
    function filterData(range) {
      const now = new Date();
      let startDate = new Date(0);

      switch (range) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "3months":
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 3);
          break;
      }

      const filtered = allData.filter(item => new Date(item.timestamp) >= startDate);
      updateChart(filtered);
      document.getElementById("status").textContent = `Showing ${filtered.length} records.`;
    }

    // Update the chart with new data
    function updateChart(data) {
      chart.data.labels = data.map(entry =>
        new Date(entry.timestamp).toLocaleString("de-CH", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        })
      );
      chart.data.datasets[0].data = data.map(entry => entry.duration);
      chart.update();
    }
  