import Button from '../components/Button/Button';
import { usePersistentState } from '../utils/storage';
import { patchLiveShareToken } from '../components/ShareLiveStatus/api';
import { copyTextToClipboard } from '../utils/clipboard';
import useShareLivePosition from './useShareLivePosition';
import { writeError } from '../utils/logs';
import CopyIcon from '../components/icons/CopyIcon';
import RefreshIcon from '../components/icons/RefreshIcon';
import BroadcastIcon from '../components/icons/BroadcastIcon';
import { classNames } from '../utils/styles';
import { useIsNewWorldRunning } from '../utils/games';
import { toast } from 'react-toastify';
import { v4 as uuid } from 'uuid';
import type { FormEvent } from 'react';
import { usePosition } from '../contexts/PositionContext';
import { useEffect, useState } from 'react';
import { useAccount, useUser } from '../contexts/UserContext';
import styles from './Streaming.module.css';
import MenuIcon from '../components/icons/MenuIcon';
import Settings from './Settings';

function Streaming(): JSX.Element {
  const { account } = useAccount();
  const [token, setToken] = usePersistentState(
    'live-share-token',
    account!.liveShareToken || ''
  );
  const { status, isConnected, isSharing, setIsSharing } =
    useShareLivePosition(token);
  const newWorldIsRunning = useIsNewWorldRunning();
  const { position } = usePosition();
  const user = useUser();
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (account?.liveShareToken) {
      setToken(account.liveShareToken);
    }
  }, [account?.liveShareToken]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      if (isSharing) {
        setIsSharing(false);
        return;
      }

      if (!token) {
        toast.error('Token is required 🙄');
        return;
      }

      if (account && account.liveShareToken !== token) {
        patchLiveShareToken(token);
      }
      setIsSharing(true);
    } catch (error) {
      writeError(error);
    }
  }

  const players = status ? Object.values(status.group) : [];
  return (
    <div className={styles.streaming}>
      <p className={styles.user}>
        <p>
          Welcome back, {account!.name}!<br />
          {newWorldIsRunning && user && position && (
            <small>
              <span className={styles.success}>Playing</span> as {user.username}{' '}
              at [{position.location[1]}, {position.location[0]}]
            </small>
          )}
          {newWorldIsRunning && !user && (
            <small>
              <span className={styles.waiting}>Connected</span> to New World.
              Waiting for position.
            </small>
          )}
          {!newWorldIsRunning && (
            <small>
              <span className={styles.warning}>Not connected</span> to New
              World. Please run the game first.
            </small>
          )}
        </p>{' '}
        <button onClick={() => setShowSettings(true)}>
          <MenuIcon />
        </button>
      </p>
      <form onSubmit={handleSubmit} className={styles.form}>
        <p className={styles.guide}>
          Use the token shown below on{' '}
          <a href="https://aeternum-map.gg" target="_blank">
            aeternum-map.gg
          </a>{' '}
          to see your live location on the map. You can use any device that has
          a browser. Share this token with your friends to see each others'
          location 🤗.
        </p>
        <div className={styles.tokenContainer}>
          <label className={styles.label}>
            Token
            <input
              disabled={isSharing}
              value={token}
              placeholder="Use this token to access your live status..."
              onChange={(event) => setToken(event.target.value)}
            />
          </label>
          <Button
            className={styles.action}
            type="button"
            onClick={() => setToken(uuid())}
            title="Generate Random Token"
          >
            <RefreshIcon />
          </Button>
          <Button
            className={styles.action}
            type="button"
            disabled={!token}
            onClick={() => {
              copyTextToClipboard(token);
            }}
            title="Copy Token"
          >
            <CopyIcon />
          </Button>
        </div>
        <div className={styles.status}>
          <aside>
            <h5>Senders</h5>
            <ul className={styles.list}>
              {players.length > 0 ? (
                players.map((player) => (
                  <li key={player.username}>
                    {player.username ? player.username : player.steamName}
                  </li>
                ))
              ) : (
                <li>No connections</li>
              )}
            </ul>
          </aside>
          <Button
            disabled={!token}
            type="submit"
            className={classNames(
              styles.submit,
              isSharing && !isConnected && styles.connecting,
              isSharing && isConnected && styles.connected
            )}
          >
            <BroadcastIcon />
            {isSharing && !isConnected && 'Connecting'}
            {isSharing && isConnected && 'Sharing'}
            {!isSharing && 'Share'}
          </Button>

          <aside>
            <h5>Receivers</h5>
            <ul className={styles.list}>
              {status?.connections.length ? (
                status.connections.map((connection) => (
                  <li key={connection}>Browser</li>
                ))
              ) : (
                <li>No connections</li>
              )}
            </ul>
          </aside>
        </div>
      </form>
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default Streaming;
