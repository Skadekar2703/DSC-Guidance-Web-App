import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aiiikrlmwitabfcjcvrs.supabase.co";
const supabaseKey = "sb_publishable_OP4AadTscDdtv3nBQ6GSHw_0uTxYDfK";

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log("=== STARTING SUPABASE END-TO-END DATA PERSISTENCE AUDIT ===");

  // 1. Audit TESTS
  console.log("\n--- 1. AUDITING TESTS MODULE ---");
  try {
    const testPayload = {
      title: "Audit Practice Test #1",
      description: "Automated test description",
      test_type: "DAILY",
      question_count: 10,
      duration: 15,
      total_marks: 10,
      external_url: "https://docs.google.com/forms/d/e/1FAIpQLScTuBAS88s7Zd/viewform",
      display_order: 1,
      is_published: true
    };
    
    console.log("Inserting into 'tests'...", testPayload);
    const { data: insertedTest, error: insertTestErr } = await supabase
      .from("tests")
      .insert([testPayload])
      .select()
      .single();

    if (insertTestErr) {
      console.error("❌ TESTS INSERT ERROR:", insertTestErr);
    } else {
      console.log("✅ TESTS INSERT SUCCESS! ID:", insertedTest.id);
      console.log("Inserted Row:", JSON.stringify(insertedTest, null, 2));

      // SELECT test back
      const { data: fetchedTest, error: selectTestErr } = await supabase
        .from("tests")
        .select("*")
        .eq("id", insertedTest.id)
        .single();
      
      if (selectTestErr) {
        console.error("❌ TESTS SELECT ERROR:", selectTestErr);
      } else {
        console.log("✅ TESTS SELECT RETRIEVAL SUCCESS:", JSON.stringify(fetchedTest, null, 2));
      }

      // UPDATE test
      const { error: updateTestErr } = await supabase
        .from("tests")
        .update({ title: "Updated Audit Practice Test #1" })
        .eq("id", insertedTest.id);

      if (updateTestErr) {
        console.error("❌ TESTS UPDATE ERROR:", updateTestErr);
      } else {
        console.log("✅ TESTS UPDATE SUCCESS!");
      }

      // DELETE test
      const { error: deleteTestErr } = await supabase
        .from("tests")
        .delete()
        .eq("id", insertedTest.id);

      if (deleteTestErr) {
        console.error("❌ TESTS DELETE ERROR:", deleteTestErr);
      } else {
        console.log("✅ TESTS DELETE SUCCESS!");
      }
    }
  } catch (err) {
    console.error("TESTS EXCEPTION:", err);
  }

  // 2. Audit TEST SERIES
  console.log("\n--- 2. AUDITING TEST SERIES MODULE ---");
  try {
    const seriesPayload = {
      title: "Audit Test Series Bundle",
      description: "Automated test series description",
      tests: [],
      is_published: true
    };

    console.log("Inserting into 'test_series'...", seriesPayload);
    const { data: insertedSeries, error: insertSeriesErr } = await supabase
      .from("test_series")
      .insert([seriesPayload])
      .select()
      .single();

    if (insertSeriesErr) {
      console.error("❌ TEST SERIES INSERT ERROR:", insertSeriesErr);
    } else {
      console.log("✅ TEST SERIES INSERT SUCCESS! ID:", insertedSeries.id);
      console.log("Inserted Row:", JSON.stringify(insertedSeries, null, 2));

      // SELECT back
      const { data: fetchedSeries, error: selectSeriesErr } = await supabase
        .from("test_series")
        .select("*")
        .eq("id", insertedSeries.id)
        .single();

      if (selectSeriesErr) {
        console.error("❌ TEST SERIES SELECT ERROR:", selectSeriesErr);
      } else {
        console.log("✅ TEST SERIES SELECT RETRIEVAL SUCCESS:", JSON.stringify(fetchedSeries, null, 2));
      }

      // DELETE
      const { error: deleteSeriesErr } = await supabase
        .from("test_series")
        .delete()
        .eq("id", insertedSeries.id);

      if (deleteSeriesErr) {
        console.error("❌ TEST SERIES DELETE ERROR:", deleteSeriesErr);
      } else {
        console.log("✅ TEST SERIES DELETE SUCCESS!");
      }
    }
  } catch (err) {
    console.error("TEST SERIES EXCEPTION:", err);
  }

  // 3. Audit MATERIALS (PDF / STUDY MATERIALS)
  console.log("\n--- 3. AUDITING MATERIALS MODULE ---");
  try {
    const materialPayload = {
      title: "Audit Study Material PDF",
      description: "Test Material Description",
      material_type: "PDF",
      pdf_url: "https://aiiikrlmwitabfcjcvrs.supabase.co/storage/v1/object/public/study-materials/materials/test.pdf",
      storage_path: "materials/test.pdf",
      file_name: "test.pdf",
      file_size: 1024,
      display_order: 1,
      is_published: true
    };

    console.log("Inserting into 'materials'...", materialPayload);
    const { data: insertedMaterial, error: insertMatErr } = await supabase
      .from("materials")
      .insert([materialPayload])
      .select()
      .single();

    if (insertMatErr) {
      console.error("❌ MATERIALS INSERT ERROR:", insertMatErr);
    } else {
      console.log("✅ MATERIALS INSERT SUCCESS! ID:", insertedMaterial.id);
      console.log("Inserted Row:", JSON.stringify(insertedMaterial, null, 2));

      // SELECT back
      const { data: fetchedMaterial, error: selectMatErr } = await supabase
        .from("materials")
        .select("*")
        .eq("id", insertedMaterial.id)
        .single();

      if (selectMatErr) {
        console.error("❌ MATERIALS SELECT ERROR:", selectMatErr);
      } else {
        console.log("✅ MATERIALS SELECT RETRIEVAL SUCCESS:", JSON.stringify(fetchedMaterial, null, 2));
      }

      // DELETE
      const { error: deleteMatErr } = await supabase
        .from("materials")
        .delete()
        .eq("id", insertedMaterial.id);

      if (deleteMatErr) {
        console.error("❌ MATERIALS DELETE ERROR:", deleteMatErr);
      } else {
        console.log("✅ MATERIALS DELETE SUCCESS!");
      }
    }
  } catch (err) {
    console.error("MATERIALS EXCEPTION:", err);
  }

  // 4. Audit PREVIOUS YEAR QUESTIONS (PYQ)
  console.log("\n--- 4. AUDITING PREVIOUS YEAR PAPERS MODULE ---");
  try {
    const pyqPayload = {
      title: "pyq paper - test",
      exam_type: "DSC",
      year: 2026,
      description: "Audit Previous Year Question Paper",
      pdf_url: "https://aiiikrlmwitabfcjcvrs.supabase.co/storage/v1/object/public/study-materials/pyq/test.pdf",
      storage_path: "pyq/test.pdf",
      file_name: "test.pdf",
      file_size: 2048,
      display_order: 1,
      is_published: true
    };

    console.log("Inserting into 'previous_year_questions'...", pyqPayload);
    const { data: insertedPyq, error: insertPyqErr } = await supabase
      .from("previous_year_questions")
      .insert([pyqPayload])
      .select()
      .single();

    if (insertPyqErr) {
      console.error("❌ PREVIOUS_YEAR_QUESTIONS INSERT ERROR:", insertPyqErr);
    } else {
      console.log("✅ PREVIOUS_YEAR_QUESTIONS INSERT SUCCESS! ID:", insertedPyq.id);
      console.log("Inserted Row:", JSON.stringify(insertedPyq, null, 2));

      // SELECT back
      const { data: fetchedPyq, error: selectPyqErr } = await supabase
        .from("previous_year_questions")
        .select("*")
        .eq("id", insertedPyq.id)
        .single();

      if (selectPyqErr) {
        console.error("❌ PREVIOUS_YEAR_QUESTIONS SELECT ERROR:", selectPyqErr);
      } else {
        console.log("✅ PREVIOUS_YEAR_QUESTIONS SELECT RETRIEVAL SUCCESS:", JSON.stringify(fetchedPyq, null, 2));
      }

      // DELETE
      const { error: deletePyqErr } = await supabase
        .from("previous_year_questions")
        .delete()
        .eq("id", insertedPyq.id);

      if (deletePyqErr) {
        console.error("❌ PREVIOUS_YEAR_QUESTIONS DELETE ERROR:", deletePyqErr);
      } else {
        console.log("✅ PREVIOUS_YEAR_QUESTIONS DELETE SUCCESS!");
      }
    }
  } catch (err) {
    console.error("PREVIOUS_YEAR_QUESTIONS EXCEPTION:", err);
  }

  console.log("\n=== AUDIT COMPLETE ===");
}

runAudit();
