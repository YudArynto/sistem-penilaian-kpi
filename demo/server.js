// ===== Code.gs =====
// ==========================================
// KODE BACKEND (Simpan di file Code.gs)
// ==========================================

function doGet(e) {
  // Menggabungkan pengaturan dari dua doGet sebelumnya menjadi satu yang optimal
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Sistem Penilaian KPI Staff Preparatory')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getSpreadsheetData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error("Script tidak terikat pada Spreadsheet.");

    var staffSheet = ss.getSheetByName('Master_Staff');
    if (!staffSheet) {
      throw new Error("Tab 'Master_Staff' tidak ditemukan.");
    }

    var staffData = getFastData(staffSheet);
    var dataSheet = ss.getSheetByName('Data_Mentah_Warping');
    var rawDataArray = [];
    
    if (dataSheet) {
      rawDataArray = getFastData(dataSheet);
    }

    return { staff: staffData, rawData: rawDataArray };
  } catch (e) {
    throw new Error(e.message); 
  }
}

function getFastData(sheet) {
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  
  if (lastRow <= 1) return []; 
  
  var data = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
  var headers = data[0];
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0] === "" && row[1] === "") continue;

    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      if(headers[j] !== "") { 
        var cleanHeader = headers[j].toString().trim();
        obj[cleanHeader] = row[j];
      }
    }
    result.push(obj);
  }
  return result;
}

// ---------------------------------------------------------------------------------
// FUNGSI BARU: Menyimpan Input Data Laporan Harian/Bulanan ke Data_Mentah_Warping
// ---------------------------------------------------------------------------------
function saveDataMentahKeSheet(record) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Data_Mentah_Warping'); 
    
    if (!sheet) {
      throw new Error("Tab 'Data_Mentah_Warping' tidak ditemukan di Spreadsheet.");
    }

    // Ambil header dari baris pertama
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Susun array data sesuai dengan urutan header di spreadsheet
    var rowData = [];
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i].toString().trim();
      rowData.push(record[header] !== undefined ? record[header] : "");
    }

    // Cek apakah data untuk Staf, Bulan, dan Tahun ini sudah ada (Fungsi Edit/Update)
    var data = sheet.getDataRange().getValues();
    var idIndex = headers.indexOf("ID_Staff");
    var bulanIndex = headers.indexOf("Bulan");
    var tahunIndex = headers.indexOf("Tahun");
    
    var rowIndexToUpdate = -1;
    
    // Pastikan header ID_Staff, Bulan & Tahun ditemukan
    if (idIndex > -1 && bulanIndex > -1 && tahunIndex > -1) {
      for (var r = 1; r < data.length; r++) {
        if (data[r][idIndex] == record.ID_Staff && 
            data[r][bulanIndex] == record.Bulan && 
            data[r][tahunIndex] == record.Tahun) {
          rowIndexToUpdate = r + 1; // +1 karena index getValues mulai dari 0, sedangkan Sheet mulai dari baris 1
          break;
        }
      }
    }

    // Jika data bulan dan tahun untuk staf ini sudah ada, timpa (update)
    if (rowIndexToUpdate > -1) {
      sheet.getRange(rowIndexToUpdate, 1, 1, rowData.length).setValues([rowData]);
    } 
    // Jika belum ada, buat baris baru di bagian paling bawah
    else {
      sheet.appendRow(rowData);
    }
    
    return true; 
  } catch (e) {
    throw new Error(e.message);
  }
}

// ---------------------------------------------------------------------------------
// FUNGSI LAMA: Menyimpan Data Final Cetak ke Sheet Penilaian_Bulanan
// ---------------------------------------------------------------------------------
function saveDataKeSheet(payload) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Penilaian_Bulanan'); 
    
    if (!sheet) {
      throw new Error("Tab 'Penilaian_Bulanan' tidak ditemukan.");
    }

    var idPenilaian = "PNL-" + new Date().getTime();
    var identitas = payload.identity;
    var kpi = payload.kpiData || {};
    var subj = payload.subjData || {};
    var tpm = payload.tpmData || {};

    // Map data agar sesuai dengan Header di Sheet Penilaian_Bulanan
    var rowData = [
      idPenilaian,
      identitas.periode,
      identitas.nama, // ID_Staff atau Nama
      
      // Data Detail KPI
      kpi['t1_1_1']?.pencapaian || kpi['t2_1_1']?.pencapaian || "", kpi['t1_1_1']?.skor || kpi['t2_1_1']?.skor || 0,
      kpi['t1_2_1']?.pencapaian || kpi['t2_2_1']?.pencapaian || "", kpi['t1_2_1']?.skor || kpi['t2_2_1']?.skor || 0,
      kpi['t1_3_1']?.pencapaian || kpi['t2_3_1']?.pencapaian || "", kpi['t1_3_1']?.skor || kpi['t2_3_1']?.skor || 0,
      kpi['t1_4_1']?.pencapaian || kpi['t2_4_1']?.pencapaian || "", kpi['t1_4_1']?.skor || kpi['t2_4_1']?.skor || 0,
      kpi['t1_5_1']?.pencapaian || kpi['t2_5_1']?.pencapaian || "", kpi['t1_5_1']?.skor || kpi['t2_5_1']?.skor || 0,
      kpi['t1_6_1']?.pencapaian || kpi['t2_6_1']?.pencapaian || "", kpi['t1_6_1']?.skor || kpi['t2_6_1']?.skor || 0,
      kpi['t1_7_1']?.pencapaian || kpi['t2_7_1']?.pencapaian || "", kpi['t1_7_1']?.skor || kpi['t2_7_1']?.skor || 0,
      kpi['t1_8_1']?.pencapaian || kpi['t2_8_1']?.pencapaian || "", kpi['t1_8_1']?.skor || kpi['t2_8_1']?.skor || 0,
      kpi['t1_9_1']?.pencapaian || kpi['t2_9_1']?.pencapaian || "", kpi['t1_9_1']?.skor || kpi['t2_9_1']?.skor || 0,
      kpi['t1_10_1']?.pencapaian || kpi['t2_10_1']?.pencapaian || "", kpi['t1_10_1']?.skor || kpi['t2_10_1']?.skor || 0,
      kpi['t1_11_1']?.pencapaian || kpi['t2_11_1']?.pencapaian || "", kpi['t1_11_1']?.skor || kpi['t2_11_1']?.skor || 0,
      kpi['t1_12_1']?.pencapaian || kpi['t2_12_1']?.pencapaian || "", kpi['t1_12_1']?.skor || kpi['t2_12_1']?.skor || 0,
      kpi['t1_13_1']?.pencapaian || kpi['t2_10_1']?.pencapaian || "", kpi['t1_13_1']?.skor || kpi['t2_10_1']?.skor || 0,
      kpi['t1_14_1']?.pencapaian || kpi['t2_11_1']?.pencapaian || "", kpi['t1_14_1']?.skor || kpi['t2_11_1']?.skor || 0,

      // Data Detail Subyektif
      subj['s1']?.pencapaian || "", subj['s1']?.skor || 0,
      subj['s2']?.pencapaian || "", subj['s2']?.skor || 0,
      subj['s3']?.pencapaian || "", subj['s3']?.skor || 0,
      subj['s4']?.pencapaian || "", subj['s4']?.skor || 0,

      // Data Detail TPM
      tpm['t1']?.pencapaian || "", tpm['t1']?.skor || 0,
      tpm['t2']?.pencapaian || "", tpm['t2']?.skor || 0,
      tpm['t3']?.pencapaian || "", tpm['t3']?.skor || 0,
      tpm['t4']?.pencapaian || "", tpm['t4']?.skor || 0,
      tpm['t5']?.pencapaian || "", tpm['t5']?.skor || 0,

      // Total & Kesimpulan
      payload.totalKpiSkor,
      payload.totalSubjSkor,
      payload.totalTpmSkor,
      payload.grandTotal,
      payload.category
    ];
    
    sheet.appendRow(rowData);
    return true; 
  } catch (e) {
    throw new Error(e.message);
  }
} 

// ==========================================
// FUNGSI UNTUK VERIFIKASI LOGIN DARI SPREADSHEET
// ==========================================
function verifyLoginServer(username, password) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Akun_User");
    
    // Cek apakah tab Akun_User sudah dibuat
    if (!sheet) {
      return { success: false, message: "Tab 'Akun_User' tidak ditemukan di Spreadsheet!" };
    }
    
    // Ambil semua data di tab Akun_User
    var data = sheet.getDataRange().getValues();
    
    // Looping data mulai dari baris ke-2 (index 1) karena baris 1 adalah Header
    for (var i = 1; i < data.length; i++) {
      var dbUser = data[i][0] ? data[i][0].toString().trim() : "";
      var dbPass = data[i][1] ? data[i][1].toString().trim() : "";
      var dbRole = data[i][2] ? data[i][2].toString().trim().toLowerCase() : "viewer";
      var dbName = data[i][3] ? data[i][3].toString().trim() : "Pengguna";
      
      // Jika username dan password cocok
      if (dbUser === username && dbPass === password) {
        return {
          success: true,
          user: {
            username: dbUser,
            role: dbRole,      // 'admin' atau 'viewer'
            name: dbName
          }
        };
      }
    }
    
    // Jika loop selesai dan tidak ada yang cocok
    return { success: false, message: "Username atau Password salah!" };
    
  } catch (e) {
    return { success: false, message: "Error server: " + e.message };
  }
}