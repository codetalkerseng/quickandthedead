import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { CHARACTER_ALIGNMENTS } from '../lib/constants';
import { compressImage } from '../lib/imageUtils';
import SheriffStar from '../components/ui/SheriffStar';
import RopeDivider from '../components/ui/RopeDivider';
import WantedFrame from '../components/ui/WantedFrame';
import { Camera, User } from 'lucide-react';

export default function Onboarding() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    nickname: '',
    handPreference: 'right',
    characterAlign: 'ellen',
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoMode, setPhotoMode] = useState('upload'); // 'upload' | 'url'
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function handleField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      setPhotoBase64(base64);
      setPhotoPreview(base64);
    } catch {
      setError('Could not load that image. Try another.');
    }
  }

  function handleUrlBlur() {
    if (photoUrl) setPhotoPreview(photoUrl);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.nickname.trim()) {
      setError('Name and Nickname are required, stranger.');
      return;
    }
    setError('');
    setBusy(true);

    const photoValue =
      photoMode === 'upload' ? photoBase64 : photoUrl || null;

    try {
      await setDoc(doc(db, 'profiles', currentUser.uid), {
        personal: {
          name: form.name.trim(),
          nickname: form.nickname.trim(),
          photoURL: photoValue,
          handPreference: form.handPreference,
          characterAlign: form.characterAlign,
        },
        status: 'alive',
        isAdmin: false,
        stats: {
          joinedAt: serverTimestamp(),
          lastMatchTime: null,
          matchesPlayed: 0,
        },
      });
      navigate('/board');
    } catch (err) {
      setError('Failed to save your profile. Try again.');
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-charcoal-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <WantedFrame title="Wanted" className="bg-parchment-200 border-2 border-dust-400">
          <div className="text-center mb-4">
            <SheriffStar size={36} className="mx-auto mb-2" />
            <h1 className="font-display text-2xl text-charcoal-900">Register, Gunslinger</h1>
            <p className="section-label text-dust-600 mt-1">Stake your claim in Redemption</p>
          </div>

          <RopeDivider />

          {error && (
            <div className="mb-4 px-3 py-2 bg-blood-800 border border-blood-600 rounded-sm">
              <p className="font-body text-parchment-100 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Photo */}
            <div>
              <label className="section-label block mb-2">Portrait</label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setPhotoMode('upload')}
                  className={`flex-1 py-1 text-xs font-sans font-bold uppercase tracking-widest rounded-sm border transition-colors ${
                    photoMode === 'upload'
                      ? 'bg-gold-500 border-gold-600 text-charcoal-900'
                      : 'bg-transparent border-dust-500 text-dust-500'
                  }`}
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoMode('url')}
                  className={`flex-1 py-1 text-xs font-sans font-bold uppercase tracking-widest rounded-sm border transition-colors ${
                    photoMode === 'url'
                      ? 'bg-gold-500 border-gold-600 text-charcoal-900'
                      : 'bg-transparent border-dust-500 text-dust-500'
                  }`}
                >
                  URL
                </button>
              </div>

              <div className="flex items-center gap-4">
                {/* Preview */}
                <div
                  className="w-20 h-20 rounded-sm border-2 border-dust-400 bg-charcoal-800
                               flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer"
                  onClick={() => photoMode === 'upload' && fileRef.current?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Portrait preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-dust-600">
                      {photoMode === 'upload' ? <Camera size={24} /> : <User size={24} />}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  {photoMode === 'upload' ? (
                    <>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="btn-ghost text-xs px-3 py-2 w-full"
                      >
                        Choose Photo
                      </button>
                      <p className="text-xs text-dust-600 font-body mt-1">
                        Tap the portrait or button. Camera-ready on mobile.
                      </p>
                    </>
                  ) : (
                    <input
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      onBlur={handleUrlBlur}
                      placeholder="https://…"
                      className="w-full bg-charcoal-800 border border-charcoal-600 text-parchment-100
                                 font-body px-3 py-2 rounded-sm text-sm focus:outline-none focus:border-gold-500
                                 placeholder-dust-600"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="section-label block mb-1">Legal Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleField('name', e.target.value)}
                placeholder="Your real name"
                className="w-full bg-charcoal-800 border border-charcoal-600 text-parchment-100
                           font-body px-3 py-2 rounded-sm focus:outline-none focus:border-gold-500
                           placeholder-dust-600"
              />
            </div>

            {/* Nickname */}
            <div>
              <label className="section-label block mb-1">Gunslinger Name (Public)</label>
              <input
                type="text"
                required
                value={form.nickname}
                onChange={(e) => handleField('nickname', e.target.value)}
                placeholder="The name they'll remember"
                className="w-full bg-charcoal-800 border border-charcoal-600 text-parchment-100
                           font-body px-3 py-2 rounded-sm focus:outline-none focus:border-gold-500
                           placeholder-dust-600"
              />
            </div>

            {/* Handedness */}
            <div>
              <label className="section-label block mb-2">Gun Hand</label>
              <div className="flex gap-3">
                {['right', 'left'].map((hand) => (
                  <button
                    key={hand}
                    type="button"
                    onClick={() => handleField('handPreference', hand)}
                    className={`flex-1 py-2 font-sans font-bold uppercase text-sm tracking-widest
                                rounded-sm border-2 transition-all ${
                      form.handPreference === hand
                        ? 'bg-gold-500 border-gold-600 text-charcoal-900'
                        : 'bg-transparent border-dust-500 text-dust-500 hover:border-dust-300'
                    }`}
                  >
                    {hand === 'right' ? '✦ Right' : '✦ Left'}
                  </button>
                ))}
              </div>
            </div>

            {/* Character Alignment */}
            <div>
              <label className="section-label block mb-1">Character Alignment</label>
              <select
                value={form.characterAlign}
                onChange={(e) => handleField('characterAlign', e.target.value)}
                className="w-full bg-charcoal-800 border border-charcoal-600 text-parchment-100
                           font-body px-3 py-2 rounded-sm focus:outline-none focus:border-gold-500"
              >
                {CHARACTER_ALIGNMENTS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <RopeDivider />

            <button
              type="submit"
              disabled={busy}
              className="btn-gold w-full disabled:opacity-50"
            >
              {busy ? 'Signing in blood…' : 'Enter the Tournament'}
            </button>
          </form>
        </WantedFrame>
      </div>
    </div>
  );
}
