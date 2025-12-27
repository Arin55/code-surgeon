const mongoose = require('mongoose');

let patientConn = null;
let adminConn = null;

async function initAuthConnections() {
  const patientUri = process.env.PATIENT_MONGODB_URI;
  const adminUri = process.env.ADMIN_MONGODB_URI;

  if (patientUri && !patientConn) {
    patientConn = await mongoose.createConnection(patientUri).asPromise();
    console.log(`Patient DB connected: ${patientConn.host}`);
  }
  if (adminUri && !adminConn) {
    adminConn = await mongoose.createConnection(adminUri).asPromise();
    console.log(`Admin DB connected: ${adminConn.host}`);
  }
}

function getPatientConnection() {
  return patientConn || mongoose.connection;
}

function getAdminConnection() {
  return adminConn || mongoose.connection;
}

module.exports = { initAuthConnections, getPatientConnection, getAdminConnection };
