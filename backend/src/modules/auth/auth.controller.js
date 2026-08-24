export function getCurrentAdmin(request, response) {
  response.status(200).json({
    success: true,
    data: {
      user: { id: request.authUser.id, email: request.authUser.email },
      profile: request.admin,
    },
  });
}
