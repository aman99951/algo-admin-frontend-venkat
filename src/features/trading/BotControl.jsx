import { useEffect, useCallback, useState } from 'react';
import { tradingAPI, mabAPI } from '../../services/api';
import { useTradingStore } from '../../store/store';
import { wsService } from '../../services/websocket';
import BotControl from '../../components/BotControl';

export default function BotControlContainer() {
	const { bots, setBots, mabState, setMabState, tradingInitialized, setTradingStatus } = useTradingStore();
	const [lockedSnapshots, setLockedSnapshots] = useState({});

	const refreshStatus = useCallback(async () => {
		try {
			const status = await tradingAPI.getStatus();
			const hasBotsArray = Array.isArray(status?.bots);
			const initialized = status?.initialized === true;
			setTradingStatus({
				tradingInitialized: initialized,
				tradingStatusUpdatedAt: new Date().toISOString(),
				tradingStatusError: null,
			});

			// Only clear bots when backend explicitly says not initialized.
			if (status?.initialized === false) {
				setBots([]);
			} else if (hasBotsArray) {
				setBots(status.bots);
			}

			return status;
		} catch (e) {
			setTradingStatus({
				tradingStatusUpdatedAt: new Date().toISOString(),
				tradingStatusError: e?.message || 'Failed to fetch status',
			});
			throw e;
		}
	}, [setBots, setTradingStatus]);

	const refreshMabState = useCallback(async () => {
		const response = await mabAPI.getState();
		setMabState(response.data || null);
		return response;
	}, [setMabState]);

	// Setup WebSocket for real-time updates
	const setupWebSocket = useCallback(() => {
		// Listen for bot status updates (real-time)
		wsService.on('bot_status', (data) => {
			console.log('[Trading WebSocket] Received bot_status:', data);
			
			// Format data for BotControl
			const botData = {
				...data,
				live_data: {
					index_price: data.metrics?.price || 0,
					decision: data.decision,
					reason: data.reason,
				},
				metrics: data.metrics,
				config: data.config,
				current_pnl: data.pnl || 0,
			};
			
			// Update specific bot in array
			setBots(prevBots => {
				const botIndex = prevBots.findIndex(b => b.index === botData.index);
				if (botIndex >= 0) {
					const updated = [...prevBots];
					updated[botIndex] = botData;
					return updated;
				} else {
					return [...prevBots, botData];
				}
			});
		});

		// Listen for metrics updates (when trades close)
		wsService.on('metrics_update', (data) => {
			console.log('[Trading WebSocket] Received metrics_update:', data);
			// Refresh MAB state when trade closes (win/loss affects arm selection)
			refreshMabState().catch(() => {});
		});
	}, [setBots, refreshMabState]);

	useEffect(() => {
		refreshStatus().catch(() => {
			// no-op
		});
		refreshMabState().catch(() => {
			// no-op
		});
		
		// Setup WebSocket for real-time updates
		setupWebSocket();
		
		// Fallback polling at longer interval (only if WebSocket fails)
		const interval = setInterval(() => {
			refreshStatus().catch(() => {
				// no-op
			});
		}, 30000); // 30s fallback (WebSocket provides real-time updates)
		const mabInterval = setInterval(() => {
			refreshMabState().catch(() => {
				// no-op
			});
		}, 60000); // 60s for MAB (only changes on trade close)
		return () => {
			clearInterval(interval);
			clearInterval(mabInterval);
		};
	}, [refreshStatus, refreshMabState, setupWebSocket]);

	// Lock displayed values at entry time while in-market; unlock when position closes.
	useEffect(() => {
		setLockedSnapshots((prev) => {
			const next = { ...prev };
			const list = Array.isArray(bots) ? bots : [];
			for (const bot of list) {
				const index = bot?.index;
				if (!index) continue;
				const inMarket = !!bot.current_position;
				if (inMarket && !next[index]) {
					next[index] = {
						locked_at: new Date().toISOString(),
						mab_variant: bot.mab_variant,
						context: bot.context,
						live_data: bot.live_data,
						mab_state: mabState?.[index] || null,
					};
				} else if (!inMarket && next[index]) {
					delete next[index];
				}
			}
			return next;
		});
	}, [bots, mabState]);

	const onInitialize = async (indices, paperMode) => {
		// When going live, we need to explicitly confirm
		const confirmLive = !paperMode;
		const initRes = await tradingAPI.initialize(indices, paperMode, confirmLive);
		await refreshStatus();
		await refreshMabState().catch(() => {
			// no-op
		});
		return initRes;
	};

	return (
		<BotControl
			bots={bots}
			mabState={mabState}
			lockedSnapshots={lockedSnapshots}
			initialized={tradingInitialized || (Array.isArray(bots) && bots.length > 0)}
			onInitialize={onInitialize}
			onRefresh={refreshStatus}
		/>
	);
}
