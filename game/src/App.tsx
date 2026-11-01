import Game from './components/Game.tsx';

import { ToastContainer } from 'react-toastify';
import helpImg from '../assets/help.svg';
import bookImg from '../assets/book.svg';
// import { UserButton } from '@clerk/clerk-react';
// import { Authenticated, Unauthenticated } from 'convex/react';
// import LoginButton from './components/buttons/LoginButton.tsx';
import { useState } from 'react';
import ReactModal from 'react-modal';
import MusicButton from './components/buttons/MusicButton.tsx';
import Button from './components/buttons/Button.tsx';
import InteractButton from './components/buttons/InteractButton.tsx';
import FreezeButton from './components/FreezeButton.tsx';
import Storybook from './components/Storybook.tsx';
import { MAX_HUMAN_PLAYERS } from '../convex/constants.ts';

export default function Home() {
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [storybookOpen, setStorybookOpen] = useState(false);
  return (
    <main className="relative h-screen w-screen overflow-hidden font-body bg-brown-900">

      <ReactModal
        isOpen={helpModalOpen}
        onRequestClose={() => setHelpModalOpen(false)}
        style={modalStyles}
        contentLabel="Help modal"
        ariaHideApp={false}
      >
        <div className="[font-family:system-ui,sans-serif] text-sm leading-relaxed text-[#1f1f1f] space-y-3">
          <h1 className="text-lg font-semibold">Nomad Café</h1>
          <p>
            Travelers drop in, chat, and swap stories on their own. Their latest line appears in a
            bubble above their head.
          </p>
          <p>
            <b>Watch:</b> drag to move around and scroll to zoom. Click a traveler to see who they
            are and their full chat history.
          </p>
          <p>
            <b>Join in:</b> click "Interact" to walk into the café yourself. Click the floor to
            move, click a traveler and choose "Start conversation" to talk. If you're idle for five
            minutes you'll be removed; at most {MAX_HUMAN_PLAYERS} people can join at once.
          </p>
        </div>
      </ReactModal>
      {/*<div className="p-3 absolute top-0 right-0 z-10 text-2xl">
        <Authenticated>
          <UserButton afterSignOutUrl="/ai-town" />
        </Authenticated>

        <Unauthenticated>
          <LoginButton />
        </Unauthenticated>
      </div> */}

      <ReactModal
        isOpen={storybookOpen}
        onRequestClose={() => setStorybookOpen(false)}
        style={storybookModalStyles}
        contentLabel="Storybook"
        ariaHideApp={false}
      >
        <Storybook />
      </ReactModal>

      <Game />

      <div className="absolute top-3 left-3 z-10 flex gap-3 pointer-events-none">
        <FreezeButton />
        <MusicButton />
        <InteractButton />
        <Button imgUrl={bookImg} onClick={() => setStorybookOpen(true)}>
          Storybook
        </Button>
        <Button imgUrl={helpImg} onClick={() => setHelpModalOpen(true)}>
          Help
        </Button>
      </div>
      <ToastContainer position="bottom-right" autoClose={2000} closeOnClick theme="dark" />
    </main>
  );
}

const modalStyles = {
  overlay: {
    backgroundColor: 'rgb(0, 0, 0, 45%)',
    zIndex: 12,
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: 'min(28rem, 90vw)',
    padding: '1.25rem',

    border: '1px solid rgb(58, 58, 58, 40%)',
    borderRadius: '0.75rem',
    background: 'rgb(255, 255, 255, 97%)',
  },
};

const storybookModalStyles = {
  overlay: modalStyles.overlay,
  content: {
    ...modalStyles.content,
    maxWidth: 'min(32rem, 92vw)',
    width: '100%',
    maxHeight: '80vh',
    overflowY: 'auto' as const,
  },
};
