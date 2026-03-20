import User from '../models/User.js';
import { Webhook } from 'svix';

const clerkWebhook = async (req, res) => {
    try {
        if (!process.env.CLERK_WEBHOOK_SECRET) {
            return res.status(500).json({
                success: false,
                message: 'Missing CLERK_WEBHOOK_SECRET',
            });
        }

        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

        const headers = {
            'svix-id': req.headers['svix-id'],
            'svix-timestamp': req.headers['svix-timestamp'],
            'svix-signature': req.headers['svix-signature'],
        };

        const payload = Buffer.isBuffer(req.body)
            ? req.body.toString('utf8')
            : JSON.stringify(req.body);

        await whook.verify(payload, headers);

        const event = JSON.parse(payload);
        const { data, type } = event;

        console.log('Clerk webhook received', {
            type,
            userId: data?.id,
            object: data?.object,
        });

        const userData = {
            _id: data.id,
            email: data.email_addresses?.[0]?.email_address,
            username:
                `${data.first_name || ''} ${data.last_name || ''}`.trim(),
            imageUrl: data.image_url,
        };

        switch (type) {
            case 'user.created':
                await User.create(userData);
                console.log('User created in DB', userData._id);
                break;
            case 'user.updated':
                await User.findByIdAndUpdate(data.id, userData, { new: true });
                console.log('User updated in DB', data.id);
                break;
            case 'user.deleted':
                await User.findByIdAndDelete(data.id);
                console.log('User deleted in DB', data.id);
                break;
        }

        res.status(200).json({
            success: true,
            message: 'Webhook successfully',
        });
    } catch (error) {
        console.error(
            'Failed to verify webhook:',
            error.message || error
        );
        res.status(400).json({
            success: false,
            message: 'Webhook failed',
        });
    }
};

export default clerkWebhook;
