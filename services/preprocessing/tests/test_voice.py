from hrip_shared.voice import derive_transcript_from_filename, sanitize_filename


def test_sanitize_filename_removes_path_tricks() -> None:
    assert sanitize_filename("../../Urgent OTP Call!!.wav") == "Urgent-OTP-Call.wav"


def test_derive_transcript_from_filename_uses_meaningful_tokens() -> None:
    transcript = derive_transcript_from_filename({"original_filename": "urgent-otp-call.wav"})
    assert transcript == "urgent otp"
