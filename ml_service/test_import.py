import traceback
try:
    from app.service import job_fetcher
    print("Imported successfully")
    print(dir(job_fetcher))
except Exception as e:
    print("Error importing job_fetcher:")
    traceback.print_exc()
