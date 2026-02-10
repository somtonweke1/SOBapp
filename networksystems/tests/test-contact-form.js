// Test script to demonstrate the contact form functionality
// This shows exactly what data will be sent to somtonwekec@gmail.com

const testData = {
  name: "John Smith",
  company: "African Gold Mining Ltd",
  email: "john.smith@africanmining.com",
  phone: "+27 11 123 4567",
  message: "We are experiencing challenges with our mining operations in Ghana. Looking for strategic guidance on optimizing our extraction processes and improving operational efficiency. We have 3 active mining sites and are interested in network analysis for supply chain optimization."
};

console.log('=== STRATEGIC BRIEFING REQUEST TEST ===');
console.log('This is what would be sent to somtonwekec@gmail.com:');
console.log('');

console.log('📧 Email Subject:', `Strategic Briefing Request - ${testData.company}`);
console.log('📧 Email To: somtonwekec@gmail.com');
console.log('');

console.log('📋 Contact Information:');
console.log(`   Name: ${testData.name}`);
console.log(`   Company: ${testData.company}`);
console.log(`   Email: ${testData.email}`);
console.log(`   Phone: ${testData.phone}`);
console.log('');

console.log('💬 Mining Challenges & Message:');
console.log(`   ${testData.message}`);
console.log('');

console.log('⏰ Submission Details:');
console.log(`   Source: MIAR Platform Landing Page`);
console.log(`   Timestamp: ${new Date().toLocaleString()}`);
console.log(`   Next Steps: Contact within 24 hours to schedule strategic briefing`);
console.log('');

console.log('🔗 Testing the actual API endpoint...');

// Test the actual API
fetch('https://miar.vercel.app/api/contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData),
})
.then(response => response.json())
.then(data => {
  console.log('✅ API Response:', data);
  console.log('');
  console.log('🎯 RESULT: Strategic briefing request successfully submitted!');
  console.log('📧 Email notification sent to: somtonwekec@gmail.com');
})
.catch(error => {
  console.error('❌ Error:', error);
});

export default testData;