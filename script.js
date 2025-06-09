
const supabaseUrl = "https://timhflcxsmjlyqjnymrm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpbWhmbGN4c21qbHlxam55bXJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MjU2MTksImV4cCI6MjA2MDQwMTYxOX0.cbZUGdOZrQ14mVf5685U6gFCe7AnX-nGHU4Joxa48Z8";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
let allData = [];
let currentRange = "today";
let currentRangeDays = 1;

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
        title: { display: true, text: "Date & Time" }
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Duration (sec)" }
      }
    }
  }
});

async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const emailMap = {
    maxi: 'maxi@test.com',
    dominik: 'dominik@test.com',
    sofie: 'sofie@test.com'
  };
  const email = emailMap[username.toLowerCase()];
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert("Login failed: " + error.message);
  } else {
    document.getElementById('loginOverlay').style.display = 'none';
    fetchData();
    
    document.getElementById('deviceStatus').style.display = 'inline';
    document.getElementById('deviceStatus').innerHTML = username + 
      '<button onclick="logout()" style="margin-left: 1rem; background: none; border: none; color: purple; cursor: pointer;">Log out</button>';
    document.getElementById('status').style.display = 'block';
    document.getElementById('trendText').style.display = 'block';
    
  }
}



async function fetchData() {
  const status = document.getElementById("status");
  
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const email = userData?.user?.email;

  if (!email) {
    status.textContent = "❌ No user email found.";
    return;
  }

  const { data, error } = await supabase
    .from("brush_records")
    .select("*")
    .eq("device", email)
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

  
    console.log("📡 Logged in as:", email);
    console.log("📦 Records returned:", data.length);
    
  
    
      updateChart(allData);
}



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
      startDate = new Date(); startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "3months":
      startDate = new Date(); startDate.setMonth(startDate.getMonth() - 3);
      break;
  
    currentRange = range;
    currentRangeDays = {
      today: 1,
      week: 7,
      month: 30,
      "3months": 90,
      all: allData.length > 0 ? Math.ceil((new Date(allData[0].timestamp) - new Date(allData[allData.length - 1].timestamp)) / (1000 * 60 * 60 * 24)) : 1
    }[range] || 1;
  }

  const filtered = allData.filter(item => new Date(item.timestamp) >= startDate);
  updateChart(filtered);
  document.getElementById("status").textContent = `Showing ${filtered.length} records.`;
}

function updateChart(data) {
  chart.data.labels = data.map(entry =>
    new Date(entry.timestamp).toLocaleString("de-CH", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
    })
  );
  chart.data.datasets[0].data = data.map(entry => entry.duration);
  chart.update();
}

function logout() {
  supabase.auth.signOut().then(() => location.reload());
}

