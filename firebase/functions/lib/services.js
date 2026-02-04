import { collections } from "./db.js";
export async function createService(req) {
    const data = (req.data ?? {});
    const providerId = String(data.providerId || "");
    const providerName = String(data.providerName || "");
    const serviceName = String(data.serviceName || "");
    const durationMinutes = Number(data.durationMinutes || 0);
    const depositRule = data.depositRule;
    const walletAddress = String(data.walletAddress || "");
    if (!providerId || !providerName || !serviceName || !depositRule) {
        throw new Error("Missing required fields");
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        throw new Error("Invalid durationMinutes");
    }
    const now = new Date().toISOString();
    const providerRef = collections.providers().doc(providerId);
    const providerSnap = await providerRef.get();
    if (!providerSnap.exists) {
        const provider = {
            name: providerName,
            walletAddress,
            createdAt: now,
            updatedAt: now
        };
        await providerRef.set(provider);
    }
    else {
        await providerRef.update({ name: providerName, walletAddress, updatedAt: now });
    }
    const service = {
        providerId,
        name: serviceName,
        durationMinutes,
        depositRule,
        createdAt: now,
        updatedAt: now
    };
    const serviceRef = await collections.services().add(service);
    return { ok: true, serviceId: serviceRef.id };
}
