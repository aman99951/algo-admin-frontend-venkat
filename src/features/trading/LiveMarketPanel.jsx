import { useEffect, useState } from 'react';
import { tradingAPI } from '../../services/api';
import LiveMarketPanel from '../../components/LiveMarketPanel';

export default function LiveMarketPanelContainer() {
	const [bots, setBots] = useState([]);
	const [initialized, setInitialized] = useState(false);

	useEffect(() => {
		let mounted = true;

		const load = async () => {
			try {
				const status = await tradingAPI.getStatus();
				if (!mounted) return;
				setInitialized(!!status.initialized);
				setBots(status.bots || []);
			} catch {
				if (!mounted) return;
				setInitialized(false);
				setBots([]);
			}
		};

		load();
		const interval = setInterval(load, 3000);
		return () => {
			mounted = false;
			clearInterval(interval);
		};
	}, []);

	if (!initialized) {
		return <div className="live-panel-empty">Initialize bots to see live market data</div>;
	}

	return (
		<div style={{ display: 'grid', gap: '16px' }}>
			{bots.map((bot) => {
				const ld = bot.live_data || {};
				const metrics = {
					price: ld.index_price,
					force_index: ld.force_index,
					acceleration: ld.acceleration,
					momentum: ld.momentum,
					volatility: ld.volatility,
					rsi: ld.rsi,
					decision: ld.decision,
					reason: ld.reason,
				};
				return <LiveMarketPanel key={bot.index} indexName={bot.index} metrics={metrics} />;
			})}
		</div>
	);
}
