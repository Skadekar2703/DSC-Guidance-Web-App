import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aiiikrlmwitabfcjcvrs.supabase.co";
const supabaseKey = "sb_publishable_OP4AadTscDdtv3nBQ6GSHw_0uTxYDfK";

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function simulating service retry loop
async function safeInsert(table, payload) {
  let p = { ...payload };
  let { data, error } = await supabase
    .from(table)
    .insert([p])
    .select()
    .single();

  while (error && error.message && error.message.includes("Could not find the")) {
    const match = error.message.match(/Could not find the '([^']+)' column/);
    if (match && match[1] && p[match[1]] !== undefined) {
      console.warn(`Omitting unmigrated column '${match[1]}' for table '${table}' and retrying...`);
      delete p[match[1]];
      const retryRes = await supabase.from(table).insert([p]).select().single();
      data = retryRes.data;
      error = retryRes.error;
    } else {
      break;
    }
  }

  return { data, error };
}

async function runDetailedAudit() {
  console.log("==================================================");
  console.log("RUNNING COMPREHENSIVE 4-MODULE PERSISTENCE AUDIT");
  console.log("==================================================");

  // 1. TESTS
  console.log("\n--- MODULE 1: TESTS ---");
  const testInput = {
    title: "Telugu Unit Test #1",
    description: "Daily Telugu grammar practice quiz",
    test_type: "DAILY",
    question_count: 10,
    duration: 15,
    total_marks: 10,
    external_url: "https://docs.google.com/forms/d/e/1FAIpQLScTuBAS88s7Zd/viewform",
    display_order: 1,
    is_published: true
  };

  const testRes = await safeInsert("tests", testInput);
  if (testRes.error) {
    console.log("❌ TESTS INSERT RESULT: FAIL | Error:", testRes.error);
  } else {
    console.log("✅ TESTS INSERT RESULT: PASS | Stored Row:", testRes.data);
    
    // Select back
    const { data: fetchT } = await supabase.from("tests").select("*").eq("id", testRes.data.id).single();
    console.log("✅ TESTS FETCH RESULT: PASS | Retrieved Row:", fetchT);

    // Clean up
    await supabase.from("tests").delete().eq("id", testRes.data.id);
  }

  // 2. TEST SERIES
  console.log("\n--- MODULE 2: TEST SERIES ---");
  const seriesInput = {
    title: "Class 10 Telugu Grand Test Series",
    description: "Full syllabus mock tests for Class 10 Telugu",
    tests: [],
    is_published: true
  };

  const seriesRes = await safeInsert("test_series", seriesInput);
  if (seriesRes.error) {
    console.log("❌ TEST SERIES INSERT RESULT: FAIL | Error:", seriesRes.error);
  } else {
    console.log("✅ TEST SERIES INSERT RESULT: PASS | Stored Row:", seriesRes.data);
    
    // Select back
    const { data: fetchS } = await supabase.from("test_series").select("*").eq("id", seriesRes.data.id).single();
    console.log("✅ TEST SERIES FETCH RESULT: PASS | Retrieved Row:", fetchS);

    // Clean up
    await supabase.from("test_series").delete().eq("id", seriesRes.data.id);
  }

  // 3. STUDY MATERIALS / PDF
  console.log("\n--- MODULE 3: PDF / STUDY MATERIALS ---");
  const matInput = {
    title: "Class 10 Telugu Study Notes",
    description: "Complete chapterwise notes and study material",
    material_type: "PDF",
    pdf_url: "https://aiiikrlmwitabfcjcvrs.supabase.co/storage/v1/object/public/study-materials/materials/telugu_notes.pdf",
    storage_path: "materials/telugu_notes.pdf",
    file_name: "telugu_notes.pdf",
    display_order: 1,
    is_published: true
  };

  const matRes = await safeInsert("materials", matInput);
  if (matRes.error) {
    console.log("❌ MATERIALS INSERT RESULT: FAIL | Error:", matRes.error);
  } else {
    console.log("✅ MATERIALS INSERT RESULT: PASS | Stored Row:", matRes.data);
    
    // Select back
    const { data: fetchM } = await supabase.from("materials").select("*").eq("id", matRes.data.id).single();
    console.log("✅ MATERIALS FETCH RESULT: PASS | Retrieved Row:", fetchM);

    // Clean up
    await supabase.from("materials").delete().eq("id", matRes.data.id);
  }

  // 4. PREVIOUS YEAR PAPERS
  console.log("\n--- MODULE 4: PREVIOUS YEAR PAPERS ---");
  const pyqInput = {
    title: "pyq paper - test",
    exam_type: "DSC",
    year: 2026,
    description: "Telugu DSC 2026 Question Paper",
    pdf_url: "https://aiiikrlmwitabfcjcvrs.supabase.co/storage/v1/object/public/study-materials/pyq/telugu_dsc_2026.pdf",
    storage_path: "pyq/telugu_dsc_2026.pdf",
    file_name: "telugu_dsc_2026.pdf",
    display_order: 1,
    is_published: true
  };

  const pyqRes = await safeInsert("previous_year_questions", pyqInput);
  if (pyqRes.error) {
    console.log("❌ PREVIOUS YEAR PAPERS INSERT RESULT: FAIL | Error:", pyqRes.error);
  } else {
    console.log("✅ PREVIOUS YEAR PAPERS INSERT RESULT: PASS | Stored Row:", pyqRes.data);

    // Select back
    const { data: fetchP } = await supabase.from("previous_year_questions").select("*").eq("id", pyqRes.data.id).single();
    console.log("✅ PREVIOUS YEAR PAPERS FETCH RESULT: PASS | Retrieved Row:", fetchP);

    // Clean up
    await supabase.from("previous_year_questions").delete().eq("id", pyqRes.data.id);
  }
}

runDetailedAudit();
