import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { CHARACTER_ALIGNMENTS } from '../lib/constants';
import { compressImage } from '../lib/imageUtils';
import PlayerAvatar from '../components/ui/PlayerAvatar';
import RopeDivider from '../components/ui/RopeDivider';
import WantedFrame from '../components/ui/WantedFrame';
import SheriffStar from '../components/ui/SheriffStar';
import { Camera, ArrowLeft, Check } from 'lucide-react';

export default function Profile() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: userProfile?.personal?.name ?? '',
    nickname: userProfile?.personal?.nickname ?? '',
    handPreference: userProfile?.personal?.handPreference ?? 'right',
    characterAlign: userProfile?.personal?.characterAlign ?? 'ellen',
  });
  const [photoPreview, setPhotoPreview] = useState(userProfile?.personal?.photoURL ?? null);
  const [photoValue, setPhotoValue] = useState(userProfile?.personal?.photoURL ?? null);
  const [photoMode, setPhotoMode] = useState('upload');
  const [photoUrl, setPhotoUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      setPhotoValue(base64);
      setPhotoPreview(base64);
    } catch {
      setError('Could not load that image. Try another.');
    }
  }

  function handleUrlBlur() {
    if (photoUrl) {
      setPhotoPreview(photoUrl);
      setPhotoValue(photoUrl);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.nickname.trim()) {
      setError('Name and Nickname are required.');
      return;
    }
    setError('');
    setBusy(true);

    try {
      await updateDoc(doc(db, 'profiles', currentUser.uid), {
        'personal.name': form.name.trim(),
        'personal.nickname': form.nickname.trim(),
        'personal.photoURL': photoValue,
        'personal.handPreference': form.handPreference,
        'personal.characterAlign': form.characterAlign,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Failed to save. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const inputCls = `w-full bg-charcoal-800 border border-charcoal-600 text-parchment-100
                    font-body px-3 py-2 rounded-sm focus:outline-none focus:border-gold-500
                    placeholder-dust-600`;

  return (
    <div className="min-h-screen bg-charcoal-900 flex flex-col items-center justify-center p-4 pb-24">
      <div className="w-full max-w-md">
        <WantedFrame title="Profile" className="bg-parchment-200 border-2 border-dust-400">
          <div className="text-center mb-4">
            <div className="mb-3 flex justify-center">
              <PlayerAvatar profile={userProfile} size="lg" />
            </div>
            <h1 className="font-display text-2xl text-charcoal-900">Your Profile</h1>
            <p className="section-label text-dust-600 mt-1">{userProfile?.personal?.nickname}</p>
          </div>

          <RopeDivider />

          {error && (
            <div className="mb-4 px-3 py-2 bg-blood-800 border border-blood-600 rounded-sm">
              <p className="font-body text-parchment-100 text-sm">{error}</p>
            </div>
          )}

          {saved && (
            <div className="mb-4 px-3 py-2 bg-charcoal-800 border border-gold-600 rounded-sm flex items-center gap-2">
              <Check size={14} className="text-gold-400" />
              <p className="font-body text-gold-300 text-sm">Profile updated.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Photo */}
            <div>
              <label className="section-label block mb-2">Portrait</label>
              <div className="flex gap-2 mb-3">
                {['upload', 'url'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPhotoMode(m)}
                    className={`flex-1 py-1 text-xs font-sans font-bold uppercase tracking-widest rounded-sm border transition-colors ${
                      photoMode === m
                        ? 'bg-gold-500 border-gold-600 text-charcoal-900'
                        : 'bg-transparent border-dust-500 text-dust-500'
                    }`}
                  >
                    {m === 'upload' ? 'Upload' : 'URL'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-sm border-2 border-dust-400 bg-charcoal-800
                               flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer"
                  onClick={() => photoMode === 'upload' && fileRef.current?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Portrait" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={24} className="text-dust-600" />
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
                        Change Photo
                      </button>
                    </>
                  ) : (
                    <input
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      onBlur={handleUrlBlur}
                      placeholder="https://…"
                      className={inputCls}
                    />
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="section-label block mb-1">Legal Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleField('name', e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="section-label block mb-1">Gunslinger Name (Public)</label>
              <input
                type="text"
                required
                value={form.nickname}
                onChange={(e) => handleField('nickname', e.target.value)}
                className={inputCls}
              />
            </div>

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

            <div>
              <label className="section-label block mb-1">Character Alignment</label>
              <select
                value={form.characterAlign}
                onChange={(e) => handleField('characterAlign', e.target.value)}
                className={inputCls}
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
              {busy ? 'Saving…' : 'Save Profile'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/board')}
              className="btn-ghost w-full flex items-center justify-center gap-2 text-sm"
            >
              <ArrowLeft size={14} /> Back to Roster
            </button>
          </form>

          <div className="mt-4 flex justify-center">
            <SheriffStar size={16} />
          </div>
        </WantedFrame>
      </div>
    </div>
  );
}
